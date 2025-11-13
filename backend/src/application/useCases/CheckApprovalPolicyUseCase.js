/**
 * CheckApprovalPolicyUseCase
 * Checks if a company requires manual approval for learning paths
 */
export class CheckApprovalPolicyUseCase {
  constructor({ companyRepository }) {
    this.companyRepository = companyRepository;
  }

  /**
   * Check if company requires approval
   * @param {string} companyId
   * @returns {Promise<{requiresApproval: boolean, company: Company|null}>}
   */
  async execute(companyId) {
    const company = await this.companyRepository.getCompanyById(companyId);

    if (!company) {
      // If company not found, default to auto (no approval needed)
      console.warn(`⚠️  Company ${companyId} not found, defaulting to auto approval`);
      return {
        requiresApproval: false,
        company: null
      };
    }

    return {
      requiresApproval: company.requiresApproval(),
      company
    };
  }
}

