/**
 * Approval Routes
 * Handles approval request endpoints
 */

import express from 'express';
import { ProcessApprovalResponseUseCase } from '../../application/useCases/ProcessApprovalResponseUseCase.js';

export function createApprovalsRouter(dependencies) {
  const router = express.Router();
  const { approvalRepository, distributePathUseCase, notificationService } = dependencies;

  if (!approvalRepository) {
    console.warn('⚠️  ApprovalRepository not available - approval routes disabled');
    return router;
  }

  const processApprovalResponseUseCase = new ProcessApprovalResponseUseCase({
    approvalRepository,
    distributePathUseCase,
    notificationService
  });

  /**
   * GET /api/v1/approvals/:approvalId
   * Get approval by ID
   */
  router.get('/:approvalId', async (req, res) => {
    try {
      const { approvalId } = req.params;
      const approval = await approvalRepository.getApprovalById(approvalId);

      if (!approval) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Approval ${approvalId} not found`
        });
      }

      res.json({
        success: true,
        approval: approval.toJSON()
      });
    } catch (error) {
      console.error('Get approval error:', error);
      res.status(500).json({
        error: 'Failed to get approval',
        details: error.message
      });
    }
  });

  /**
   * POST /api/v1/approvals/:approvalId/approve
   * Approve a learning path
   */
  router.post('/:approvalId/approve', async (req, res) => {
    try {
      const { approvalId } = req.params;
      const { feedback } = req.body;

      const approval = await processApprovalResponseUseCase.execute(
        approvalId,
        'approved',
        feedback
      );

      res.json({
        success: true,
        message: 'Learning path approved',
        approval: approval.toJSON()
      });
    } catch (error) {
      console.error('Approve error:', error);
      res.status(400).json({
        error: 'Failed to approve',
        details: error.message
      });
    }
  });

  /**
   * POST /api/v1/approvals/:approvalId/reject
   * Reject a learning path
   */
  router.post('/:approvalId/reject', async (req, res) => {
    try {
      const { approvalId } = req.params;
      const { feedback } = req.body;

      const approval = await processApprovalResponseUseCase.execute(
        approvalId,
        'rejected',
        feedback
      );

      res.json({
        success: true,
        message: 'Learning path rejected',
        approval: approval.toJSON()
      });
    } catch (error) {
      console.error('Reject error:', error);
      res.status(400).json({
        error: 'Failed to reject',
        details: error.message
      });
    }
  });

  /**
   * GET /api/v1/approvals/pending/:decisionMakerId
   * Get pending approvals for a decision maker
   */
  router.get('/pending/:decisionMakerId', async (req, res) => {
    try {
      const { decisionMakerId } = req.params;
      const approvals = await approvalRepository.getPendingApprovalsByDecisionMaker(decisionMakerId);

      res.json({
        success: true,
        approvals: approvals.map(approval => approval.toJSON()),
        count: approvals.length
      });
    } catch (error) {
      console.error('Get pending approvals error:', error);
      res.status(500).json({
        error: 'Failed to get pending approvals',
        details: error.message
      });
    }
  });

  return router;
}

