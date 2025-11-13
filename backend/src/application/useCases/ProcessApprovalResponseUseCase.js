/**
 * ProcessApprovalResponseUseCase
 * Handles approval/rejection responses from decision makers
 */
export class ProcessApprovalResponseUseCase {
  constructor({ approvalRepository, notificationService }) {
    this.approvalRepository = approvalRepository;
    this.notificationService = notificationService;
  }

  /**
   * Process approval response
   * @param {string} approvalId
   * @param {string} status - 'approved' or 'rejected'
   * @param {string|null} feedback - Optional feedback for rejection
   * @returns {Promise<PathApproval>}
   */
  async execute(approvalId, status, feedback = null) {
    if (status !== 'approved' && status !== 'rejected') {
      throw new Error('Status must be "approved" or "rejected"');
    }

    // Get current approval
    const approval = await this.approvalRepository.getApprovalById(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    if (!approval.isPending()) {
      throw new Error(`Approval ${approvalId} is already ${approval.status}`);
    }

    // Update approval status
    const updatedApproval = await this.approvalRepository.updateApprovalStatus(
      approvalId,
      status,
      feedback
    );

    // Send notification (optional)
    try {
      await this.notificationService.sendApprovalStatus(updatedApproval, null);
    } catch (error) {
      console.error('Failed to send approval status notification:', error.message);
    }

    console.log(`✅ Approval ${approvalId} ${status}`);

    return updatedApproval;
  }
}

