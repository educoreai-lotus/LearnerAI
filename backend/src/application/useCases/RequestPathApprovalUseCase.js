import { v4 as uuidv4 } from 'uuid';
import { PathApproval } from '../../domain/entities/PathApproval.js';

/**
 * RequestPathApprovalUseCase
 * Creates an approval request and notifies the decision maker
 */
export class RequestPathApprovalUseCase {
  constructor({ approvalRepository, notificationService }) {
    this.approvalRepository = approvalRepository;
    this.notificationService = notificationService;
  }

  /**
   * Create approval request and send notification
   * @param {Object} params
   * @param {string} params.learningPathId
   * @param {string} params.companyId
   * @param {Object} params.decisionMaker - { employee_id, name, email }
   * @param {Object} params.learningPath - Learning path data
   * @returns {Promise<PathApproval>}
   */
  async execute({ learningPathId, companyId, decisionMaker, learningPath }) {
    // Create approval entity
    const approval = new PathApproval({
      id: uuidv4(),
      learningPathId,
      companyId,
      decisionMakerId: decisionMaker.employee_id,
      status: 'pending'
    });

    // Save to database
    const savedApproval = await this.approvalRepository.createApproval(approval);

    // Send notification to decision maker
    try {
      await this.notificationService.sendApprovalRequest(
        savedApproval,
        learningPath,
        decisionMaker
      );
    } catch (error) {
      console.error('Failed to send approval notification:', error.message);
      // Don't fail the entire process if notification fails
    }

    console.log(`✅ Approval request created: ${savedApproval.id} for path ${learningPathId}`);

    return savedApproval;
  }
}

