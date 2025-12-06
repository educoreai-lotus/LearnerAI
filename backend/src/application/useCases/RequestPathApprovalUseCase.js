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
    // Check if an approval already exists for this learning path
    const existingApproval = await this.approvalRepository.getApprovalByLearningPathId(learningPathId);
    
    let savedApproval;
    
    if (existingApproval) {
      // If approval exists, update it to 'pending' status (for path updates/regenerations)
      console.log(`🔄 Found existing approval ${existingApproval.id} for path ${learningPathId} - updating to pending`);
      savedApproval = await this.approvalRepository.updateApproval(existingApproval.id, {
        status: 'pending',
        feedback: null, // Clear previous feedback
        approvedAt: null,
        rejectedAt: null,
        changesRequestedAt: null
      });
    } else {
      // Create new approval entity
      const approval = new PathApproval({
        id: uuidv4(),
        learningPathId,
        companyId,
        decisionMakerId: decisionMaker.employee_id,
        status: 'pending'
      });

      // Save to database
      savedApproval = await this.approvalRepository.createApproval(approval);
    }

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

