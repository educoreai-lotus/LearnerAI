/**
 * PathApproval Domain Entity
 * Represents an approval request for a learning path
 */
export class PathApproval {
  constructor({
    id,
    learningPathId,
    companyId,
    decisionMakerId,
    status = 'pending', // 'pending', 'approved', 'rejected', 'changes_requested'
    feedback = null,
    approvedAt = null,
    rejectedAt = null,
    changesRequestedAt = null,
    createdAt,
    updatedAt
  }) {
    if (!learningPathId || !companyId || !decisionMakerId) {
      throw new Error('PathApproval requires learningPathId, companyId, and decisionMakerId');
    }

    if (!['pending', 'approved', 'rejected', 'changes_requested'].includes(status)) {
      throw new Error('status must be "pending", "approved", "rejected", or "changes_requested"');
    }

    this.id = id;
    this.learningPathId = learningPathId;
    this.companyId = companyId;
    this.decisionMakerId = decisionMakerId;
    this.status = status;
    this.feedback = feedback;
    this.approvedAt = approvedAt;
    this.rejectedAt = rejectedAt;
    this.changesRequestedAt = changesRequestedAt;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  isPending() {
    return this.status === 'pending';
  }

  isApproved() {
    return this.status === 'approved';
  }

  isRejected() {
    return this.status === 'rejected';
  }

  isChangesRequested() {
    return this.status === 'changes_requested';
  }

  toJSON() {
    return {
      id: this.id,
      learningPathId: this.learningPathId,
      companyId: this.companyId,
      decisionMakerId: this.decisionMakerId,
      status: this.status,
      feedback: this.feedback,
      approvedAt: this.approvedAt,
      rejectedAt: this.rejectedAt,
      changesRequestedAt: this.changesRequestedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

