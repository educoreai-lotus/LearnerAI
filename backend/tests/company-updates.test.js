import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ProcessCompanyUpdateUseCase } from '../src/application/useCases/ProcessCompanyUpdateUseCase.js';
import { createMockCompany, createMockLearner } from './testHelpers.js';

/**
 * Feature: Company Updates
 * 
 * Tests processing company registration/updates from Directory microservice:
 * - Upserting company data
 * - Syncing learner data when company updates
 * - Handling approval policy changes
 * - Updating decision maker information
 */
describe('Feature: Company Updates', () => {
  let useCase;
  let mockCompanyRepository;
  let mockLearnerRepository;

  beforeEach(() => {
    mockCompanyRepository = {
      upsertCompany: jest.fn(),
      getCompanyById: jest.fn()
    };

    mockLearnerRepository = {
      getLearnersByCompany: jest.fn().mockResolvedValue([]), // Default to empty array
      updateLearner: jest.fn()
    };

    useCase = new ProcessCompanyUpdateUseCase({
      companyRepository: mockCompanyRepository,
      learnerRepository: mockLearnerRepository
    });
  });

  describe('Company Upsert', () => {
    it('should create or update company data', async () => {
      const companyData = {
        company_id: 'company-456',
        company_name: 'TechCorp Inc.',
        approval_policy: 'auto',
        decision_maker: null
      };

      const mockCompany = createMockCompany();
      mockCompany.created_at = new Date().toISOString(); // Add created_at to distinguish create vs update
      mockCompanyRepository.upsertCompany.mockResolvedValue(mockCompany);

      await useCase.execute(companyData);

      expect(mockCompanyRepository.upsertCompany).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: 'company-456',
          company_name: 'TechCorp Inc.',
          approval_policy: 'auto',
          decision_maker: null
        })
      );
    });

    it('should handle manual approval policy with decision maker', async () => {
      const companyData = {
        company_id: 'company-456',
        company_name: 'TechCorp Inc.',
        approval_policy: 'manual',
        decision_maker: {
          employee_id: 'emp-123',
          employee_name: 'John Doe',
          employee_email: 'john@techcorp.com'
        }
      };

      mockCompanyRepository.upsertCompany.mockResolvedValue(
        createMockCompany({
          approvalPolicy: 'manual',
          decisionMaker: companyData.decision_maker
        })
      );

      await useCase.execute(companyData);

      expect(mockCompanyRepository.upsertCompany).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: 'company-456',
          company_name: 'TechCorp Inc.',
          approval_policy: 'manual',
          decision_maker: companyData.decision_maker
        })
      );
    });
  });

  describe('Learner Sync', () => {
    it('should sync all learners when company data changes', async () => {
      const companyData = {
        company_id: 'company-456',
        company_name: 'TechCorp Inc. Updated',
        approval_policy: 'manual'
      };

      const existingLearners = [
        createMockLearner({ userId: 'user-1', companyId: 'company-456' }),
        createMockLearner({ userId: 'user-2', companyId: 'company-456' })
      ];

      mockCompanyRepository.upsertCompany.mockResolvedValue(createMockCompany());
      mockLearnerRepository.getLearnersByCompany.mockResolvedValue(existingLearners);
      mockLearnerRepository.updateLearner.mockResolvedValue({});

      await useCase.execute(companyData);

      expect(mockLearnerRepository.getLearnersByCompany).toHaveBeenCalledWith('company-456');
      expect(mockLearnerRepository.updateLearner).toHaveBeenCalledTimes(2);
    });
  });

  // Add more tests for error handling, edge cases, etc.
});

