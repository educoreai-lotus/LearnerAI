/**
 * ProcessApprovalResponseUseCase
 * Handles approval, rejection, or changes request for learning paths
 */
export class ProcessApprovalResponseUseCase {
  constructor({ approvalRepository, distributePathUseCase, notificationService, courseRepository, learnerRepository }) {
    this.approvalRepository = approvalRepository;
    this.distributePathUseCase = distributePathUseCase;
    this.notificationService = notificationService;
    this.courseRepository = courseRepository;
    this.learnerRepository = learnerRepository;
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

    // If approved, update the course's approved field and distribute the learning path
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

      // Distribute the learning path
      if (this.distributePathUseCase) {
        try {
          await this.distributePathUseCase.execute(approval.learningPathId);
          console.log(`✅ Learning path ${approval.learningPathId} distributed after approval`);
        } catch (error) {
          console.error(`⚠️  Failed to distribute path after approval: ${error.message}`);
          // Don't fail the approval process if distribution fails
        }
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

