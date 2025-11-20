/**
 * ProcessApprovalResponseUseCase
 * Handles approval or rejection of learning paths
 */
export class ProcessApprovalResponseUseCase {
  constructor({ approvalRepository, distributePathUseCase, notificationService }) {
    this.approvalRepository = approvalRepository;
    this.distributePathUseCase = distributePathUseCase;
    this.notificationService = notificationService;
  }

  /**
   * Process approval response (approve or reject)
   * @param {string} approvalId
   * @param {string} response - 'approved' or 'rejected'
   * @param {string} feedback - Optional feedback message
   * @returns {Promise<PathApproval>}
   */
  async execute(approvalId, response, feedback = null) {
    if (!['approved', 'rejected'].includes(response)) {
      throw new Error('Response must be "approved" or "rejected"');
    }

    // Get the approval
    const approval = await this.approvalRepository.getApprovalById(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    if (!approval.isPending()) {
      throw new Error(`Approval ${approvalId} is already ${approval.status}`);
    }

    // Update approval status
    const updatedApproval = await this.approvalRepository.updateApproval(approvalId, {
      status: response,
      feedback,
      approvedAt: response === 'approved' ? new Date().toISOString() : null,
      rejectedAt: response === 'rejected' ? new Date().toISOString() : null
    });

    // If approved, distribute the learning path
    if (response === 'approved' && this.distributePathUseCase) {
      try {
        await this.distributePathUseCase.execute(approval.learningPathId);
        console.log(`✅ Learning path ${approval.learningPathId} distributed after approval`);
      } catch (error) {
        console.error(`⚠️  Failed to distribute path after approval: ${error.message}`);
        // Don't fail the approval process if distribution fails
      }
    }

    // Send notification
    if (this.notificationService) {
      try {
        // Get learning path data for notification (would need to fetch from repository)
        await this.notificationService.sendApprovalStatus(updatedApproval, {
          id: approval.learningPathId
        });
      } catch (error) {
        console.error('Failed to send approval status notification:', error.message);
        // Don't fail the process if notification fails
      }
    }

    console.log(`✅ Approval ${approvalId} ${response}${feedback ? ` with feedback: ${feedback}` : ''}`);

    return updatedApproval;
  }
}

