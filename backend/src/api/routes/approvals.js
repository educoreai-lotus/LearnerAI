import express from 'express';
import { ProcessApprovalResponseUseCase } from '../../application/useCases/ProcessApprovalResponseUseCase.js';
import { DistributePathUseCase } from '../../application/useCases/DistributePathUseCase.js';

/**
 * Create approvals router
 * @param {Object} dependencies
 * @returns {express.Router}
 */
export function createApprovalsRouter(dependencies) {
  const router = express.Router();
  const {
    approvalRepository,
    notificationService,
    courseBuilderClient,
    analyticsClient,
    reportsClient,
    repository
  } = dependencies;

  if (!approvalRepository) {
    console.warn('⚠️  ApprovalRepository not available - approvals routes disabled');
    return router;
  }

  const processApprovalUseCase = new ProcessApprovalResponseUseCase({
    approvalRepository,
    notificationService
  });

  const distributePathUseCase = new DistributePathUseCase({
    courseBuilderClient,
    analyticsClient,
    reportsClient,
    repository
  });

  /**
   * POST /api/v1/approvals/:approvalId/approve
   * Approve a learning path
   */
  router.post('/:approvalId/approve', async (req, res) => {
    try {
      const { approvalId } = req.params;
      
      const approval = await processApprovalUseCase.execute(approvalId, 'approved');

      // If approved, distribute to Course Builder and other services
      if (approval.isApproved()) {
        try {
          const distributionResults = await distributePathUseCase.execute(approval.learningPathId);
          
          res.status(200).json({
            message: 'Learning path approved and distributed',
            approval: approval.toJSON(),
            distribution: distributionResults
          });
        } catch (distError) {
          // Approval succeeded but distribution failed
          console.error('Approval succeeded but distribution failed:', distError);
          res.status(200).json({
            message: 'Learning path approved, but distribution had errors',
            approval: approval.toJSON(),
            distribution: {
              errors: [distError.message]
            }
          });
        }
      } else {
        res.status(200).json({
          message: 'Approval processed',
          approval: approval.toJSON()
        });
      }
    } catch (error) {
      console.error('Error approving path:', error);
      res.status(400).json({
        error: 'Failed to approve learning path',
        message: error.message
      });
    }
  });

  /**
   * POST /api/v1/approvals/:approvalId/reject
   * Reject a learning path with optional feedback
   */
  router.post('/:approvalId/reject', async (req, res) => {
    try {
      const { approvalId } = req.params;
      const { feedback } = req.body;

      const approval = await processApprovalUseCase.execute(approvalId, 'rejected', feedback);

      res.status(200).json({
        message: 'Learning path rejected',
        approval: approval.toJSON()
      });
    } catch (error) {
      console.error('Error rejecting path:', error);
      res.status(400).json({
        error: 'Failed to reject learning path',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/approvals/:approvalId
   * Get approval status
   */
  router.get('/:approvalId', async (req, res) => {
    try {
      const { approvalId } = req.params;
      const approval = await approvalRepository.getApprovalById(approvalId);

      if (!approval) {
        return res.status(404).json({
          error: 'Approval not found'
        });
      }

      res.json(approval.toJSON());
    } catch (error) {
      console.error('Error getting approval:', error);
      res.status(500).json({
        error: 'Failed to get approval',
        message: error.message
      });
    }
  });

  return router;
}

