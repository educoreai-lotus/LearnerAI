/**
 * GetLearningPathForCourseBuilderUseCase
 * Returns learning path data to Course Builder when requested
 * Waits for approval if path is not yet approved
 */
export class GetLearningPathForCourseBuilderUseCase {
  constructor({ courseRepository, approvalRepository, skillsGapRepository, learnerRepository }) {
    this.courseRepository = courseRepository;
    this.approvalRepository = approvalRepository;
    this.skillsGapRepository = skillsGapRepository;
    this.learnerRepository = learnerRepository;
  }

  /**
   * Get learning path data for Course Builder
   * @param {string} userId - User ID
   * @param {string} competencyTargetName - Competency target name (learning path ID)
   * @param {Object} options - Options
   * @param {number} options.maxWaitTime - Maximum time to wait for approval in ms (default: 30000 = 30 seconds)
   * @param {number} options.pollInterval - Interval to check approval status in ms (default: 1000 = 1 second)
   * @returns {Promise<{approved: boolean, data: Object|null, message: string}>}
   */
  async execute(userId, competencyTargetName, options = {}) {
    const maxWaitTime = options.maxWaitTime || 30000; // 30 seconds default
    const pollInterval = options.pollInterval || 1000; // 1 second default
    const startTime = Date.now();

    // Get learning path
    const course = await this.courseRepository.getCourseById(competencyTargetName);
    if (!course) {
      throw new Error(`Learning path not found: ${competencyTargetName}`);
    }

    // Verify it belongs to the user
    if (course.user_id !== userId) {
      throw new Error(`Learning path ${competencyTargetName} does not belong to user ${userId}`);
    }

    // Check if approved
    const isApproved = course.approved === true;

    if (isApproved) {
      // Path is approved - return data immediately
      return await this._buildResponseData(course, userId, competencyTargetName, true);
    }

    // Path is not approved yet - wait for approval
    console.log(`⏳ Learning path ${competencyTargetName} is not approved yet. Waiting for approval...`);

    // Poll for approval status
    while (Date.now() - startTime < maxWaitTime) {
      // Check if path is now approved
      const updatedCourse = await this.courseRepository.getCourseById(competencyTargetName);
      if (updatedCourse && updatedCourse.approved === true) {
        console.log(`✅ Learning path ${competencyTargetName} is now approved. Returning data.`);
        return await this._buildResponseData(updatedCourse, userId, competencyTargetName, true);
      }

      // Check approval status
      const approval = await this.approvalRepository.getApprovalByLearningPathId(competencyTargetName);
      if (approval && approval.status === 'approved') {
        // Approval was just approved - update course and return
        await this.courseRepository.updateCourse(competencyTargetName, { approved: true });
        const finalCourse = await this.courseRepository.getCourseById(competencyTargetName);
        console.log(`✅ Learning path ${competencyTargetName} approved. Returning data.`);
        return await this._buildResponseData(finalCourse, userId, competencyTargetName, true);
      }

      if (approval && approval.status === 'rejected') {
        throw new Error(`Learning path ${competencyTargetName} was rejected. Cannot provide data to Course Builder.`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Timeout - path still not approved
    console.warn(`⏱️  Timeout waiting for approval of learning path ${competencyTargetName}`);
    return {
      approved: false,
      data: null,
      message: `Learning path ${competencyTargetName} is not approved yet. Please try again later.`,
      status: 'pending_approval'
    };
  }

  /**
   * Build response data for Course Builder
   * @private
   */
  async _buildResponseData(course, userId, competencyTargetName, isApproved) {
    // Get skills gap data for additional context
    let skillsGap = null;
    if (this.skillsGapRepository) {
      try {
        skillsGap = await this.skillsGapRepository.getSkillsGapByUserAndCompetency(userId, competencyTargetName);
      } catch (error) {
        console.warn(`⚠️  Could not fetch skills gap data: ${error.message}`);
      }
    }

    // Get learner data
    let learner = null;
    if (this.learnerRepository) {
      try {
        learner = await this.learnerRepository.getLearnerById(userId);
      } catch (error) {
        console.warn(`⚠️  Could not fetch learner data: ${error.message}`);
      }
    }

    // Parse learning path data
    let learningPathData = course.learning_path;
    if (typeof learningPathData === 'string') {
      try {
        learningPathData = JSON.parse(learningPathData);
      } catch (e) {
        console.warn(`⚠️  Could not parse learning path data: ${e.message}`);
        learningPathData = {};
      }
    }

    // Build Course Builder payload
    const responseData = {
      user_id: userId,
      user_name: skillsGap?.user_name || learner?.user_name || 'Unknown',
      company_id: skillsGap?.company_id || learner?.company_id || null,
      company_name: skillsGap?.company_name || learner?.company_name || 'Unknown',
      competency_target_name: competencyTargetName,
      learning_path: learningPathData,
      approved: isApproved,
      created_at: course.created_at,
      last_modified_at: course.last_modified_at
    };

    return {
      approved: isApproved,
      data: responseData,
      message: isApproved 
        ? `Learning path ${competencyTargetName} is approved and ready` 
        : `Learning path ${competencyTargetName} data retrieved`
    };
  }
}

