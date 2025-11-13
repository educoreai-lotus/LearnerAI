import express from 'express';
import { RegisterCompanyUseCase } from '../../application/useCases/RegisterCompanyUseCase.js';

/**
 * Create companies router
 * @param {Object} dependencies
 * @returns {express.Router}
 */
export function createCompaniesRouter(dependencies) {
  const router = express.Router();
  const { companyRepository } = dependencies;

  if (!companyRepository) {
    console.warn('⚠️  CompanyRepository not available - companies routes disabled');
    return router;
  }

  const registerCompanyUseCase = new RegisterCompanyUseCase({ companyRepository });

  /**
   * POST /api/v1/companies/register
   * Register a company (called by Directory microservice)
   */
  router.post('/register', async (req, res) => {
    try {
      const companyData = req.body;

      // Validate service token (in production, verify against Directory microservice)
      // For now, accept any request with proper structure

      const company = await registerCompanyUseCase.execute(companyData);

      res.status(201).json({
        message: 'Company registered successfully',
        company: company.toJSON()
      });
    } catch (error) {
      console.error('Error registering company:', error);
      res.status(400).json({
        error: 'Failed to register company',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/companies/:companyId
   * Get company information
   */
  router.get('/:companyId', async (req, res) => {
    try {
      const { companyId } = req.params;
      const company = await companyRepository.getCompanyById(companyId);

      if (!company) {
        return res.status(404).json({
          error: 'Company not found'
        });
      }

      res.json(company.toJSON());
    } catch (error) {
      console.error('Error getting company:', error);
      res.status(500).json({
        error: 'Failed to get company',
        message: error.message
      });
    }
  });

  return router;
}

