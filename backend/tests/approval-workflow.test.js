import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CheckApprovalPolicyUseCase } from '../src/application/useCases/CheckApprovalPolicyUseCase.js';
import { RequestPathApprovalUseCase } from '../src/application/useCases/RequestPathApprovalUseCase.js';
import { ProcessApprovalResponseUseCase } from '../src/application/useCases/ProcessApprovalResponseUseCase.js';
import { Company } from '../src/domain/entities/Company.js';
import { PathApproval } from '../src/domain/entities/PathApproval.js';
import { createMockCompany, createMockLearningPath, createMockPathApproval } from './testHelpers.js';

/**
 * Feature: Approval Workflow
 * 
 * Tests the approval workflow for learning paths:
 * - Checking company approval policy (auto vs manual)
 * - Creating approval requests for manual approval
 * - Processing approval/rejection responses
 * - Distributing paths after approval
 * - Handling rejection feedback
 */
describe('Feature: Approval Workflow', () => {
  describe('CheckApprovalPolicyUseCase', () => {
    let useCase;
    let mockCompanyRepository;

    beforeEach(() => {
      mockCompanyRepository = {
        getCompanyById: jest.fn()
      };

      useCase = new CheckApprovalPolicyUseCase({
        companyRepository: mockCompanyRepository
      });
    });

    it('should return requiresApproval: false for auto approval companies', async () => {
      const companyData = createMockCompany({ approvalPolicy: 'auto' });
      const company = new Company(companyData);
      mockCompanyRepository.getCompanyById.mockResolvedValue(company);

      const result = await useCase.execute('company-456');

      expect(result.requiresApproval).toBe(false);
      expect(result.company).toBe(company);
    });

    it('should return requiresApproval: true for manual approval companies', async () => {
      const companyData = createMockCompany({
        approvalPolicy: 'manual',
        decisionMaker: { employee_id: 'emp-123', name: 'John Doe', email: 'john@example.com' }
      });
      const company = new Company(companyData);
      mockCompanyRepository.getCompanyById.mockResolvedValue(company);

      const result = await useCase.execute('company-456');

      expect(result.requiresApproval).toBe(true);
      expect(result.company).toBe(company);
      expect(result.company.decisionMaker.employee_id).toBe('emp-123');
    });
  });

  describe('RequestPathApprovalUseCase', () => {
    let useCase;
    let mockApprovalRepository;
    let mockNotificationService;

    beforeEach(() => {
      mockApprovalRepository = {
        createApproval: jest.fn()
      };

      mockNotificationService = {
        sendApprovalRequest: jest.fn()
      };

      useCase = new RequestPathApprovalUseCase({
        approvalRepository: mockApprovalRepository,
        notificationService: mockNotificationService
      });
    });

    it('should create approval request and send notification', async () => {
      const learningPath = createMockLearningPath();
      const decisionMaker = {
        employee_id: 'emp-123',
        name: 'John Doe',
        email: 'john@example.com'
      };

      mockApprovalRepository.createApproval.mockResolvedValue({
        id: 'approval-123',
        learningPathId: 'path-123',
        companyId: 'company-456',
        decisionMakerId: 'emp-123',
        status: 'pending'
      });

      await useCase.execute({
        learningPathId: 'path-123',
        learningPath,
        companyId: 'company-456',
        decisionMaker
      });

      expect(mockApprovalRepository.createApproval).toHaveBeenCalled();
      expect(mockNotificationService.sendApprovalRequest).toHaveBeenCalled();
    });
  });

  describe('ProcessApprovalResponseUseCase', () => {
    let useCase;
    let mockApprovalRepository;
    let mockDistributePathUseCase;
    let mockNotificationService;

    beforeEach(() => {
      mockApprovalRepository = {
        getApprovalById: jest.fn(),
        updateApproval: jest.fn()
      };

      mockDistributePathUseCase = {
        execute: jest.fn()
      };

      mockNotificationService = {
        sendApprovalNotification: jest.fn()
      };

      useCase = new ProcessApprovalResponseUseCase({
        approvalRepository: mockApprovalRepository,
        distributePathUseCase: mockDistributePathUseCase,
        notificationService: mockNotificationService
      });
    });

    it('should approve path and trigger distribution', async () => {
      const approvalData = createMockPathApproval({
        id: 'approval-123',
        learningPathId: 'path-123',
        status: 'pending'
      });
      const approval = new PathApproval(approvalData);

      mockApprovalRepository.getApprovalById.mockResolvedValue(approval);
      const updatedApprovalData = { ...approvalData, status: 'approved' };
      mockApprovalRepository.updateApproval.mockResolvedValue(new PathApproval(updatedApprovalData));

      await useCase.execute('approval-123', 'approved', 'Looks good!');

      expect(mockApprovalRepository.updateApproval).toHaveBeenCalledWith(
        'approval-123',
        expect.objectContaining({ status: 'approved' })
      );
      expect(mockDistributePathUseCase.execute).toHaveBeenCalledWith('path-123');
    });

    it('should reject path and store feedback', async () => {
      const approvalData = createMockPathApproval({
        id: 'approval-123',
        learningPathId: 'path-123',
        status: 'pending'
      });
      const approval = new PathApproval(approvalData);

      mockApprovalRepository.getApprovalById.mockResolvedValue(approval);
      const updatedApprovalData = {
        ...approvalData,
        status: 'rejected',
        feedback: 'Needs more practical examples'
      };
      mockApprovalRepository.updateApproval.mockResolvedValue(new PathApproval(updatedApprovalData));

      await useCase.execute('approval-123', 'rejected', 'Needs more practical examples');

      expect(mockApprovalRepository.updateApproval).toHaveBeenCalledWith(
        'approval-123',
        expect.objectContaining({
          status: 'rejected',
          feedback: 'Needs more practical examples'
        })
      );
      expect(mockDistributePathUseCase.execute).not.toHaveBeenCalled();
    });
  });

  // Add more tests for error handling, edge cases, etc.
});

