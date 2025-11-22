import sgMail from '@sendgrid/mail';
import {
  getApprovalRequestTemplate,
  getApprovalStatusApprovedTemplate,
  getApprovalStatusChangesRequestedTemplate
} from './emailTemplates.js';

/**
 * NotificationService
 * Handles sending email notifications via SendGrid
 */
export class NotificationService {
  constructor() {
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    if (sendGridApiKey) {
      sgMail.setApiKey(sendGridApiKey);
      this.sendGridEnabled = true;
    } else {
      console.warn('⚠️  SENDGRID_API_KEY not set - email notifications will be logged only');
      this.sendGridEnabled = false;
    }
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@learnerai.com';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  /**
   * Send approval request notification to decision maker
   * @param {Object} approvalData - Approval request data
   * @param {Object} learningPath - Learning path data
   * @param {Object} decisionMaker - Decision maker info { email, name }
   * @returns {Promise<void>}
   */
  async sendApprovalRequest(approvalData, learningPath, decisionMaker) {
    if (!decisionMaker.email) {
      console.warn('⚠️  Decision maker email not provided, skipping notification');
      return;
    }

    const subject = `Learning Path Approval Required - ${learningPath.pathTitle || learningPath.path_title || 'New Path'}`;
    const htmlContent = getApprovalRequestTemplate(approvalData, learningPath, decisionMaker, this.frontendUrl);

    if (this.sendGridEnabled) {
      try {
        await sgMail.send({
          to: decisionMaker.email,
          from: this.fromEmail,
          subject,
          html: htmlContent
        });
        console.log(`✅ Approval request email sent to ${decisionMaker.email}`);
      } catch (error) {
        console.error('❌ Failed to send approval request email:', error.message);
        // Log fallback
        this._logEmailFallback('Approval Request', decisionMaker.email, subject);
      }
    } else {
      this._logEmailFallback('Approval Request', decisionMaker.email, subject);
    }
  }

  /**
   * Send approval status notification to requester
   * @param {Object} approvalData - Updated approval data
   * @param {Object} learningPath - Learning path data
   * @param {Object} requester - Requester info { email, name } (optional)
   * @returns {Promise<void>}
   */
  async sendApprovalStatus(approvalData, learningPath, requester = null) {
    // If no requester email, try to get from learning path user_id
    // Note: In a real system, you'd fetch the learner's email from the database
    if (!requester || !requester.email) {
      console.warn('⚠️  Requester email not provided, skipping status notification');
      return;
    }

    let subject, htmlContent;

    if (approvalData.status === 'approved') {
      subject = `Learning Path Approved - ${learningPath.pathTitle || learningPath.path_title || 'Your Learning Path'}`;
      htmlContent = getApprovalStatusApprovedTemplate(approvalData, learningPath, requester, this.frontendUrl);
    } else if (approvalData.status === 'changes_requested') {
      subject = `Changes Requested - ${learningPath.pathTitle || learningPath.path_title || 'Your Learning Path'}`;
      htmlContent = getApprovalStatusChangesRequestedTemplate(approvalData, learningPath, requester, this.frontendUrl);
    } else {
      // For rejected status, use changes_requested template
      subject = `Learning Path Update - ${learningPath.pathTitle || learningPath.path_title || 'Your Learning Path'}`;
      htmlContent = getApprovalStatusChangesRequestedTemplate(approvalData, learningPath, requester, this.frontendUrl);
    }

    if (this.sendGridEnabled) {
      try {
        await sgMail.send({
          to: requester.email,
          from: this.fromEmail,
          subject,
          html: htmlContent
        });
        console.log(`✅ Approval status email sent to ${requester.email}`);
      } catch (error) {
        console.error('❌ Failed to send approval status email:', error.message);
        this._logEmailFallback('Approval Status', requester.email, subject);
      }
    } else {
      this._logEmailFallback('Approval Status', requester.email, subject);
    }
  }

  /**
   * Log email fallback when SendGrid is not configured
   * @private
   */
  _logEmailFallback(type, to, subject) {
    console.log(`📧 ${type} Email (SendGrid not configured):`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Configure SENDGRID_API_KEY to enable email delivery`);
  }
}

