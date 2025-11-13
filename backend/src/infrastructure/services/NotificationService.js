/**
 * NotificationService
 * Handles sending notifications to decision makers
 * In production, this would integrate with email/SMS services
 */
export class NotificationService {
  constructor() {
    // In production, initialize email/SMS clients here
  }

  /**
   * Send approval request notification to decision maker
   * @param {Object} approvalData - Approval request data
   * @param {Object} learningPath - Learning path data
   * @param {Object} decisionMaker - Decision maker info { email, name }
   * @returns {Promise<void>}
   */
  async sendApprovalRequest(approvalData, learningPath, decisionMaker) {
    // TODO: Integrate with email service (e.g., SendGrid, AWS SES)
    // For now, log the notification
    console.log('📧 Approval Request Notification:');
    console.log(`   To: ${decisionMaker.email}`);
    console.log(`   Subject: Learning Path Approval Required - ${learningPath.pathTitle || 'New Path'}`);
    console.log(`   Approval ID: ${approvalData.id}`);
    console.log(`   Learning Path ID: ${approvalData.learningPathId}`);
    console.log(`   Link: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/approvals/${approvalData.id}`);
    
    // In production:
    // await emailClient.send({
    //   to: decisionMaker.email,
    //   subject: `Learning Path Approval Required - ${learningPath.pathTitle}`,
    //   template: 'approval-request',
    //   data: { approvalData, learningPath, decisionMaker }
    // });
  }

  /**
   * Send approval status notification
   * @param {Object} approvalData - Updated approval data
   * @param {Object} learningPath - Learning path data
   * @returns {Promise<void>}
   */
  async sendApprovalStatus(approvalData, learningPath) {
    console.log('📧 Approval Status Notification:');
    console.log(`   Status: ${approvalData.status}`);
    console.log(`   Learning Path ID: ${approvalData.learningPathId}`);
    if (approvalData.feedback) {
      console.log(`   Feedback: ${approvalData.feedback}`);
    }
  }
}

