/**
 * GetApprovalDetailsUseCase
 * Retrieves approval details with full learning path information
 */
export class GetApprovalDetailsUseCase {
  constructor({ approvalRepository, courseRepository, companyRepository, learnerRepository }) {
    this.approvalRepository = approvalRepository;
    this.courseRepository = courseRepository;
    this.companyRepository = companyRepository;
    this.learnerRepository = learnerRepository;
  }

  /**
   * Get approval details with learning path
   * @param {string} approvalId
   * @param {string} userId - User ID for authorization check (decision maker or admin)
   * @returns {Promise<Object>}
   */
  async execute(approvalId, userId) {
    // Get approval
    const approval = await this.approvalRepository.getApprovalById(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    // Authorization check: user must be the decision maker
    // Note: In a real system, you'd check if userId matches decisionMakerId or is an admin
    // For now, we'll validate in the route handler

    // Get learning path (course) by competency_target_name
    const course = await this.courseRepository.getCourseById(approval.learningPathId);
    if (!course) {
      throw new Error(`Learning path ${approval.learningPathId} not found`);
    }

    // Parse learning_path JSONB field
    let learningPathData = course.learning_path;
    if (typeof learningPathData === 'string') {
      try {
        learningPathData = JSON.parse(learningPathData);
      } catch (e) {
        learningPathData = {};
      }
    }

    // Get company info
    const company = await this.companyRepository.getCompanyById(approval.companyId);
    
    // Get learner (requester) info
    const learner = await this.learnerRepository.getLearnerById(course.user_id);

    // Get decision maker info from company
    let decisionMaker = null;
    if (company && company.decisionMaker) {
      decisionMaker = typeof company.decisionMaker === 'string' 
        ? JSON.parse(company.decisionMaker)
        : company.decisionMaker;
    }

    // Format response
    return {
      approval: approval.toJSON(),
      learningPath: {
        id: approval.learningPathId,
        title: learningPathData.pathTitle || learningPathData.path_title || approval.learningPathId,
        goal: learningPathData.pathGoal || learningPathData.path_goal || learningPathData.description || '',
        description: learningPathData.description || learningPathData.pathDescription || '',
        duration: learningPathData.totalDurationHours || learningPathData.total_estimated_duration_hours || null,
        difficulty: learningPathData.difficulty || learningPathData.difficultyLevel || null,
        audience: learningPathData.audience || learningPathData.targetAudience || null,
        modules: learningPathData.learning_modules || learningPathData.modules || learningPathData.pathSteps || [],
        subtopics: learningPathData.subtopics || [],
        status: course.approved ? 'approved' : 'pending',
        createdAt: course.created_at || course.createdAt,
        requester: learner ? {
          id: learner.user_id,
          name: learner.user_name,
          email: null // Not stored in learners table
        } : null,
        decisionMaker: decisionMaker ? {
          id: decisionMaker.employee_id || decisionMaker.id,
          name: decisionMaker.name,
          email: decisionMaker.email
        } : null
      }
    };
  }
}

