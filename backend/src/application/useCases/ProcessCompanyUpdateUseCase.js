/**
 * ProcessCompanyUpdateUseCase
 * Handles company registration/updates from Directory microservice
 * 
 * Flow:
 * 1. Upsert company in companies table
 * 2. Update all existing learners with this company_id to sync their data
 */
export class ProcessCompanyUpdateUseCase {
  constructor({
    companyRepository,
    learnerRepository
  }) {
    this.companyRepository = companyRepository;
    this.learnerRepository = learnerRepository;
  }

  /**
   * Process company update from Directory
   * @param {Object} companyData
   * @param {string} companyData.company_id
   * @param {string} companyData.company_name
   * @param {string} companyData.approval_policy - "auto" | "manual"
   * @param {Object} companyData.decision_maker - { employee_id, employee_name, employee_email }
   * @returns {Promise<Object>} Company data
   */
  async execute(companyData) {
    const {
      company_id,
      company_name,
      approval_policy,
      decision_maker
    } = companyData;

    // Validate required fields
    if (!company_id || !company_name || !approval_policy) {
      throw new Error('Missing required fields: company_id, company_name, approval_policy');
    }

    // Validate approval_policy
    if (!['auto', 'manual'].includes(approval_policy)) {
      throw new Error('approval_policy must be "auto" or "manual"');
    }

    // Step 1: Upsert company in companies table
    const company = await this.companyRepository.upsertCompany({
      company_id,
      company_name,
      approval_policy,
      decision_maker
    });

    console.log(`✅ Company ${company_name} (${company_id}) ${company.created_at ? 'created' : 'updated'}`);

    // Step 2: Update all existing learners with this company_id
    // Sync their company_name (decision_maker_policy is in companies table, not learners)
    try {
      const learners = await this.learnerRepository.getLearnersByCompany(company_id);
      
      for (const learner of learners) {
        await this.learnerRepository.updateLearner(learner.user_id, {
          company_name // Update company name in case it changed
          // Note: decision_maker_policy and decision_maker_id are in companies table, not learners
          // Learners reference companies via company_id foreign key
        });
      }

      if (learners.length > 0) {
        console.log(`✅ Updated ${learners.length} learners for company ${company_id}`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not update learners for company ${company_id}: ${error.message}`);
      // Don't fail the entire process if learner update fails
    }

    return company;
  }
}

