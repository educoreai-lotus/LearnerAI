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
    console.log(`[GetApprovalDetailsUseCase] Fetching approval: ${approvalId}`);
    
    // Get approval
    const approval = await this.approvalRepository.getApprovalById(approvalId);
    if (!approval) {
      console.error(`[GetApprovalDetailsUseCase] Approval not found: ${approvalId}`);
      throw new Error(`Approval ${approvalId} not found`);
    }

    console.log(`[GetApprovalDetailsUseCase] Approval found:`, {
      id: approval.id,
      learningPathId: approval.learningPathId,
      status: approval.status
    });

    // Authorization check: user must be the decision maker
    // Note: In a real system, you'd check if userId matches decisionMakerId or is an admin
    // For now, we'll validate in the route handler

    // Get learning path (course) by competency_target_name
    console.log(`[GetApprovalDetailsUseCase] Fetching course: ${approval.learningPathId}`);
    const course = await this.courseRepository.getCourseById(approval.learningPathId);
    if (!course) {
      console.error(`[GetApprovalDetailsUseCase] Course not found for learning_path_id: ${approval.learningPathId}`);
      throw new Error(`Learning path ${approval.learningPathId} not found. The learning path may not have been generated yet.`);
    }

    console.log(`[GetApprovalDetailsUseCase] Course found:`, {
      competency_target_name: course.competency_target_name,
      user_id: course.user_id,
      approved: course.approved
    });

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
    console.log(`[GetApprovalDetailsUseCase] Fetching company: ${approval.companyId}`);
    const company = await this.companyRepository.getCompanyById(approval.companyId);
    
    // Get learner (requester) info
    console.log(`[GetApprovalDetailsUseCase] Fetching learner: ${course.user_id}`);
    const learner = await this.learnerRepository.getLearnerById(course.user_id);

    // Get decision maker info from company
    let decisionMaker = null;
    if (company && company.decisionMaker) {
      decisionMaker = typeof company.decisionMaker === 'string' 
        ? JSON.parse(company.decisionMaker)
        : company.decisionMaker;
    }

    // Format response
    const formattedResponse = {
      approval: approval.toJSON(),
      learningPath: {
        id: approval.learningPathId,
        title: learningPathData.pathTitle || learningPathData.path_title || approval.learningPathId,
        goal: learningPathData.pathGoal || learningPathData.path_goal || learningPathData.description || '',
        description: learningPathData.pathDescription || learningPathData.description || '',
        duration: learningPathData.totalDurationHours || learningPathData.total_estimated_duration_hours || null,
        difficulty: learningPathData.difficulty || learningPathData.difficultyLevel || null,
        audience: learningPathData.audience || learningPathData.targetAudience || null,
        modules: learningPathData.learning_modules || learningPathData.modules || learningPathData.pathSteps || [],
        subtopics: learningPathData.subtopics || [],
        status: course.approved ? 'approved' : 'pending',
        createdAt: course.created_at || course.createdAt,
        requester: learner ? {
          id: learner.user_id || learner.userId,
          name: learner.user_name || learner.userName,
          email: null // Not stored in learners table
        } : null,
        decisionMaker: decisionMaker ? {
          id: decisionMaker.employee_id || decisionMaker.id,
          name: decisionMaker.employee_name || decisionMaker.name,
          email: decisionMaker.employee_email || decisionMaker.email
        } : null
      }
    };

    console.log(`[GetApprovalDetailsUseCase] Response formatted:`, {
      approvalId: formattedResponse.approval.id,
      learningPathTitle: formattedResponse.learningPath.title,
      modulesCount: formattedResponse.learningPath.modules?.length || 0
    });

    return formattedResponse;
  }
}

