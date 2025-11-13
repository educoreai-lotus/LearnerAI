import { Company } from '../../domain/entities/Company.js';

/**
 * RegisterCompanyUseCase
 * Handles company registration from Directory microservice
 */
export class RegisterCompanyUseCase {
  constructor({ companyRepository }) {
    this.companyRepository = companyRepository;
  }

  /**
   * Register a new company or update existing one
   * @param {Object} companyData - Company data from Directory microservice
   * @returns {Promise<Company>}
   */
  async execute(companyData) {
    const { company_id, company_name, approval_policy, decision_maker } = companyData;

    // Validate required fields
    if (!company_id || !company_name || !approval_policy) {
      throw new Error('Missing required fields: company_id, company_name, approval_policy');
    }

    // Create company entity
    const company = new Company({
      companyId: company_id,
      companyName: company_name,
      approvalPolicy: approval_policy,
      decisionMaker: decision_maker || null
    });

    // Save to database
    const savedCompany = await this.companyRepository.saveCompany(company);

    console.log(`✅ Company registered: ${savedCompany.companyName} (${savedCompany.approvalPolicy} approval)`);

    return savedCompany;
  }
}

