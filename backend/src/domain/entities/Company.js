/**
 * Company Domain Entity
 * Represents a company with approval policy and decision maker information
 */
export class Company {
  constructor({
    companyId,
    companyName,
    approvalPolicy, // 'auto' or 'manual'
    decisionMaker, // { employee_id, name, email }
    createdAt,
    updatedAt
  }) {
    if (!companyId || !companyName || !approvalPolicy) {
      throw new Error('Company requires companyId, companyName, and approvalPolicy');
    }

    if (approvalPolicy !== 'auto' && approvalPolicy !== 'manual') {
      throw new Error('approvalPolicy must be "auto" or "manual"');
    }

    if (approvalPolicy === 'manual' && !decisionMaker) {
      throw new Error('decisionMaker is required when approvalPolicy is "manual"');
    }

    this.companyId = companyId;
    this.companyName = companyName;
    this.approvalPolicy = approvalPolicy;
    this.decisionMaker = decisionMaker || null;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  requiresApproval() {
    return this.approvalPolicy === 'manual';
  }

  toJSON() {
    return {
      companyId: this.companyId,
      companyName: this.companyName,
      approvalPolicy: this.approvalPolicy,
      decisionMaker: this.decisionMaker,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

