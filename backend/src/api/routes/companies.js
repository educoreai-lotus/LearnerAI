import express from 'express';
import { ProcessCompanyUpdateUseCase } from '../../application/useCases/ProcessCompanyUpdateUseCase.js';

const router = express.Router();

/**
 * Initialize routes with dependencies
 */
export function createCompaniesRouter(dependencies) {
  const { 
    companyRepository,
    learnerRepository
  } = dependencies;

  // Initialize use case for Directory company updates
  const processCompanyUpdateUseCase = companyRepository
    ? new ProcessCompanyUpdateUseCase({
        companyRepository,
        learnerRepository
      })
    : null;

  /**
   * POST /api/v1/companies/register
   * Receive company registration/update from Directory microservice
   * 
   * Expected body from Directory:
   * {
   *   company_id: "uuid",
   *   company_name: "string",
   *   approval_policy: "auto" | "manual",
   *   decision_maker: {
   *     employee_id: "uuid",
   *     employee_name: "string",
   *     employee_email: "string"
   *   }
   * }
   */
  router.post('/register', async (req, res) => {
    try {
      const {
        company_id,
        company_name,
        approval_policy,
        decision_maker
      } = req.body;

      // Validate required fields
      if (!company_id || !company_name || !approval_policy) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'company_id, company_name, and approval_policy are required'
        });
      }

      // Validate approval_policy
      if (!['auto', 'manual'].includes(approval_policy)) {
        return res.status(400).json({
          error: 'Invalid approval_policy',
          message: 'approval_policy must be "auto" or "manual"'
        });
      }

      // Validate decision_maker if manual policy
      if (approval_policy === 'manual' && !decision_maker) {
        return res.status(400).json({
          error: 'Missing decision_maker',
          message: 'decision_maker is required when approval_policy is "manual"'
        });
      }

      if (processCompanyUpdateUseCase) {
        // Use the new flow: Process company update
        const company = await processCompanyUpdateUseCase.execute({
          company_id,
          company_name,
          approval_policy,
          decision_maker
        });

        return res.status(200).json({
          message: 'Company processed successfully',
          company
        });
      } else {
        // Fallback: Direct repository call
        const company = await companyRepository.upsertCompany({
          company_id,
          company_name,
          approval_policy,
          decision_maker
        });

        return res.status(200).json({
          message: 'Company registered successfully',
          company
        });
      }
    } catch (error) {
      console.error('Error processing company:', error);
      res.status(500).json({
        error: 'Failed to process company',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/companies/:companyId
   * Get company by company_id
   */
  router.get('/:companyId', async (req, res) => {
    try {
      const { companyId } = req.params;
      const company = await companyRepository.getCompanyById(companyId);

      if (!company) {
        return res.status(404).json({
          error: 'Company not found',
          message: `No company found with company_id: ${companyId}`
        });
      }

      res.json({ company });
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({
        error: 'Failed to fetch company',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/companies
   * Get all companies
   */
  router.get('/', async (req, res) => {
    try {
      const companies = await companyRepository.getAllCompanies();

      res.json({
        count: companies.length,
        companies
      });
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({
        error: 'Failed to fetch companies',
        message: error.message
      });
    }
  });

  return router;
}
