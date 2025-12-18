/**
 * ProcessApprovalResponseUseCase
 * Handles approval, rejection, or changes request for learning paths
 */
export class ProcessApprovalResponseUseCase {
  constructor({ approvalRepository, distributePathUseCase, notificationService, courseRepository, learnerRepository, skillsGapRepository, coordinatorClient }) {
    this.approvalRepository = approvalRepository;
    this.distributePathUseCase = distributePathUseCase;
    this.notificationService = notificationService;
    this.courseRepository = courseRepository;
    this.learnerRepository = learnerRepository;
    this.skillsGapRepository = skillsGapRepository || null;
    this.coordinatorClient = coordinatorClient || null;
  }

  _convertSkillsToArray(skillsRawData) {
    if (!skillsRawData) return [];
    if (Array.isArray(skillsRawData)) return skillsRawData.filter(Boolean);
    if (typeof skillsRawData !== 'object') return [];
    const out = [];
    for (const value of Object.values(skillsRawData)) {
      if (Array.isArray(value)) out.push(...value);
      else if (typeof value === 'string') out.push(value);
    }
    return Array.from(new Set(out.filter(Boolean)));
  }

  _buildPrompt3LearningPath(pathData, onlyModule = null) {
    const lp = {};
    lp.path_title = pathData?.path_title || 'Learning Path';
    lp.learner_id = pathData?.learner_id;
    lp.total_estimated_duration_hours = pathData?.total_estimated_duration_hours ?? 0;
    const modules = Array.isArray(pathData?.learning_modules) ? pathData.learning_modules : [];
    lp.learning_modules = onlyModule ? [onlyModule] : modules;
    return lp;
  }

  async _pushApprovedLearningPathToCourseBuilder({ course, skillsGap }) {
    if (!this.coordinatorClient || !this.coordinatorClient.isConfigured()) {
      console.warn('⚠️  CoordinatorClient not configured - skipping push_learning_path');
      return;
    }

    let pathData = course?.learning_path || {};
    if (typeof pathData === 'string') {
      try { pathData = JSON.parse(pathData); } catch { pathData = {}; }
    }

    const modules = Array.isArray(pathData?.learning_modules) ? pathData.learning_modules : [];
    if (modules.length === 0) {
      console.warn('⚠️  No learning_modules found - skipping push_learning_path');
      return;
    }

    const skillsRawArray = this._convertSkillsToArray(skillsGap?.skills_raw_data);
    const requestBody = {
      requester_service: 'learnerAI',
      payload: {
        action: 'push_learning_path',
        description: 'Send an approved learning path immediately to Course Builder (auto: after generation; manual: after decision maker approval).',
        user_id: course.user_id,
        user_name: skillsGap?.user_name || null,
        preferred_language: skillsGap?.preferred_language || null,
        company_id: skillsGap?.company_id || null,
        company_name: skillsGap?.company_name || null,
        competency_target_name: course.competency_target_name,
        exam_status: skillsGap?.exam_status || null,
        skills_raw_data: skillsRawArray,
        learning_path: this._buildPrompt3LearningPath(pathData, null)
      },
      response: {}
    };

    try {
      await this.coordinatorClient.postFillContentMetrics(requestBody);
      console.log('✅ push_learning_path sent to Coordinator (full learning path)');
    } catch (e) {
      console.error(`❌ push_learning_path failed (full learning path): ${e.message}`);
    }
  }

  /**
   * Process approval response (approve, reject, or request changes)
   * @param {string} approvalId
   * @param {string} response - 'approved', 'rejected', or 'changes_requested'
   * @param {string} feedback - Optional feedback message (required for changes_requested)
   * @returns {Promise<PathApproval>}
   */
  async execute(approvalId, response, feedback = null) {
    if (!['approved', 'rejected', 'changes_requested'].includes(response)) {
      throw new Error('Response must be "approved", "rejected", or "changes_requested"');
    }

    if (response === 'changes_requested' && !feedback) {
      throw new Error('Feedback is required when requesting changes');
    }

    // Get the approval
    const approval = await this.approvalRepository.getApprovalById(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    // Allow approval if status is 'pending' or 'changes_requested'
    // Reject if already 'approved' or 'rejected'
    if (approval.isApproved()) {
      throw new Error(`Approval ${approvalId} is already approved`);
    }
    if (approval.isRejected()) {
      throw new Error(`Approval ${approvalId} is already rejected`);
    }
    // Allow processing if pending or changes_requested

    // Update approval status
    const updatedApproval = await this.approvalRepository.updateApproval(approvalId, {
      status: response,
      feedback,
      approvedAt: response === 'approved' ? new Date().toISOString() : null,
      rejectedAt: response === 'rejected' ? new Date().toISOString() : null,
      changesRequestedAt: response === 'changes_requested' ? new Date().toISOString() : null
    });

    // If approved, update the course's approved field
    // NOTE: We do NOT automatically distribute to Course Builder.
    // Course Builder will request data when needed via the request endpoint.
    if (response === 'approved') {
      // Update the course's approved field to true
      if (this.courseRepository) {
        try {
          await this.courseRepository.updateCourse(approval.learningPathId, { approved: true });
          console.log(`✅ Course ${approval.learningPathId} marked as approved in courses table`);
        } catch (error) {
          console.error(`⚠️  Failed to update course approved status: ${error.message}`);
          // Don't fail the approval process if course update fails
        }
      }

      // Proactively push to Course Builder via Coordinator (one request per course/module)
      try {
        if (this.courseRepository && this.skillsGapRepository) {
          const course = await this.courseRepository.getCourseById(approval.learningPathId);
          if (course) {
            const skillsGap = await this.skillsGapRepository.getSkillsGapByUserAndCompetency(
              course.user_id,
              course.competency_target_name
            );
            await this._pushApprovedLearningPathToCourseBuilder({ course, skillsGap });
          }
        }
      } catch (e) {
        console.error(`⚠️  Failed to push approved learning path to Coordinator: ${e.message}`);
      }
    }

    // Send notification to requester (if approved or changes_requested)
    if (this.notificationService && (response === 'approved' || response === 'changes_requested')) {
      try {
        // Get learning path and requester info for notification
        if (this.courseRepository && this.learnerRepository) {
          const course = await this.courseRepository.getCourseById(approval.learningPathId);
          if (course) {
            const learner = await this.learnerRepository.getLearnerById(course.user_id);
            
            // Parse learning path data
            let learningPathData = course.learning_path;
            if (typeof learningPathData === 'string') {
              try {
                learningPathData = JSON.parse(learningPathData);
              } catch (e) {
                learningPathData = {};
              }
            }

            // Send notification (email would need to be available from learner or Directory)
            await this.notificationService.sendApprovalStatus(
              updatedApproval.toJSON(),
              learningPathData,
              learner ? { name: learner.user_name, email: null } : null
            );
          }
        }
      } catch (error) {
        console.error('Failed to send approval status notification:', error.message);
        // Don't fail the process if notification fails
      }
    }

    console.log(`✅ Approval ${approvalId} ${response}${feedback ? ` with feedback: ${feedback}` : ''}`);

    return updatedApproval;
  }
}

