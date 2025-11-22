/**
 * Approval Routes
 * Handles approval request endpoints
 */

import express from 'express';
import { ProcessApprovalResponseUseCase } from '../../application/useCases/ProcessApprovalResponseUseCase.js';
import { GetApprovalDetailsUseCase } from '../../application/useCases/GetApprovalDetailsUseCase.js';

export function createApprovalsRouter(dependencies) {
  const router = express.Router();
  const { 
    approvalRepository, 
    distributePathUseCase, 
    notificationService,
    courseRepository,
    companyRepository,
    learnerRepository
  } = dependencies;

  if (!approvalRepository) {
    console.warn('⚠️  ApprovalRepository not available - approval routes disabled');
    return router;
  }

  const processApprovalResponseUseCase = new ProcessApprovalResponseUseCase({
    approvalRepository,
    distributePathUseCase,
    notificationService,
    courseRepository,
    learnerRepository
  });

  const getApprovalDetailsUseCase = new GetApprovalDetailsUseCase({
    approvalRepository,
    courseRepository,
    companyRepository,
    learnerRepository
  });

  /**
   * GET /api/v1/approvals/:approvalId
   * Get approval details with full learning path information
   * Returns: approval details + learning path (title, goal, description, duration, difficulty, modules, etc.)
   */
  router.get('/:approvalId', async (req, res) => {
    try {
      const { approvalId } = req.params;
      // Get userId from query or headers (for authorization)
      // In a real system, this would come from authentication middleware
      const userId = req.query.userId || req.headers['x-user-id'];

      const result = await getApprovalDetailsUseCase.execute(approvalId, userId);

      // Authorization check: user must be the decision maker
      // Note: In production, you'd verify this against the authenticated user
      // For now, we'll allow access if userId matches decisionMakerId or if no userId provided (for testing)
      if (userId && result.approval.decisionMakerId !== userId) {
        // In production, also check if user is admin
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this approval'
        });
      }

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Get approval error:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message
        });
      }
      res.status(500).json({
        error: 'Failed to get approval',
        details: error.message
      });
    }
  });

  /**
   * POST /api/v1/approvals/:approvalId/approve
   * Approve a learning path
   * Marks approval as "approved", records timestamp, and sends notification to requester
   */
  router.post('/:approvalId/approve', async (req, res) => {
    try {
      const { approvalId } = req.params;
      const { feedback } = req.body;
      const userId = req.query.userId || req.headers['x-user-id']; // For authorization

      // Get approval first to check authorization
      const approval = await approvalRepository.getApprovalById(approvalId);
      if (!approval) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Approval ${approvalId} not found`
        });
      }

      // Authorization check
      if (userId && approval.decisionMakerId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to approve this request'
        });
      }

      // Process approval
      const updatedApproval = await processApprovalResponseUseCase.execute(
        approvalId,
        'approved',
        feedback
      );

      // Get learning path and requester info for notification
      try {
        const course = await courseRepository.getCourseById(approval.learningPathId);
        const learner = course ? await learnerRepository.getLearnerById(course.user_id) : null;
        
        if (course && learner && notificationService) {
          // Parse learning path data
          let learningPathData = course.learning_path;
          if (typeof learningPathData === 'string') {
            try {
              learningPathData = JSON.parse(learningPathData);
            } catch (e) {
              learningPathData = {};
            }
          }

          // Send notification to requester (if email available)
          // Note: Email would need to be stored in learners table or fetched from Directory
          await notificationService.sendApprovalStatus(
            updatedApproval.toJSON(),
            learningPathData,
            { name: learner.user_name, email: null } // Email not available in current schema
          );
        }
      } catch (notifError) {
        console.error('Failed to send approval notification:', notifError.message);
        // Don't fail the approval if notification fails
      }

      res.json({
        success: true,
        message: 'Learning path approved successfully',
        approval: updatedApproval.toJSON()
      });
    } catch (error) {
      console.error('Approve error:', error);
      if (error.message.includes('not found') || error.message.includes('already')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message
        });
      }
      res.status(500).json({
        error: 'Failed to approve',
        details: error.message
      });
    }
  });

  /**
   * POST /api/v1/approvals/:approvalId/request-changes
   * Request changes to a learning path
   * Marks approval as "changes_requested", requires feedback, and sends notification to requester
   */
  router.post('/:approvalId/request-changes', async (req, res) => {
    try {
      const { approvalId } = req.params;
      const { feedback } = req.body;
      const userId = req.query.userId || req.headers['x-user-id']; // For authorization

      // Validate feedback is provided
      if (!feedback || !feedback.trim()) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Feedback is required when requesting changes'
        });
      }

      // Get approval first to check authorization
      const approval = await approvalRepository.getApprovalById(approvalId);
      if (!approval) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Approval ${approvalId} not found`
        });
      }

      // Authorization check
      if (userId && approval.decisionMakerId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to request changes for this approval'
        });
      }

      // Process changes request
      const updatedApproval = await processApprovalResponseUseCase.execute(
        approvalId,
        'changes_requested',
        feedback.trim()
      );

      // Get learning path and requester info for notification
      try {
        const course = await courseRepository.getCourseById(approval.learningPathId);
        const learner = course ? await learnerRepository.getLearnerById(course.user_id) : null;
        
        if (course && learner && notificationService) {
          // Parse learning path data
          let learningPathData = course.learning_path;
          if (typeof learningPathData === 'string') {
            try {
              learningPathData = JSON.parse(learningPathData);
            } catch (e) {
              learningPathData = {};
            }
          }

          // Send notification to requester with feedback
          await notificationService.sendApprovalStatus(
            updatedApproval.toJSON(),
            learningPathData,
            { name: learner.user_name, email: null } // Email not available in current schema
          );
        }
      } catch (notifError) {
        console.error('Failed to send changes request notification:', notifError.message);
        // Don't fail the request if notification fails
      }

      res.json({
        success: true,
        message: 'Changes requested successfully',
        approval: updatedApproval.toJSON()
      });
    } catch (error) {
      console.error('Request changes error:', error);
      if (error.message.includes('not found') || error.message.includes('already')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message
        });
      }
      res.status(500).json({
        error: 'Failed to request changes',
        details: error.message
      });
    }
  });

  /**
   * POST /api/v1/approvals/:approvalId/reject
   * Reject a learning path (kept for backward compatibility)
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

