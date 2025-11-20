import { createClient } from '@supabase/supabase-js';
import { PathApproval } from '../../domain/entities/PathApproval.js';

/**
 * ApprovalRepository
 * Handles all database operations for path_approvals table
 */
export class ApprovalRepository {
  constructor(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new approval request
   * @param {PathApproval} approval
   * @returns {Promise<PathApproval>}
   */
  async createApproval(approval) {
    const { data, error } = await this.client
      .from('path_approvals')
      .insert({
        id: approval.id,
        learning_path_id: approval.learningPathId,
        company_id: approval.companyId,
        decision_maker_id: approval.decisionMakerId,
        status: approval.status,
        feedback: approval.feedback || null,
        approved_at: approval.approvedAt || null,
        rejected_at: approval.rejectedAt || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create approval: ${error.message}`);
    }

    return this._mapToPathApproval(data);
  }

  /**
   * Get approval by ID
   * @param {string} approvalId
   * @returns {Promise<PathApproval|null>}
   */
  async getApprovalById(approvalId) {
    const { data, error } = await this.client
      .from('path_approvals')
      .select('*')
      .eq('id', approvalId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get approval: ${error.message}`);
    }

    return this._mapToPathApproval(data);
  }

  /**
   * Get approval by learning path ID
   * @param {string} learningPathId
   * @returns {Promise<PathApproval|null>}
   */
  async getApprovalByLearningPathId(learningPathId) {
    const { data, error } = await this.client
      .from('path_approvals')
      .select('*')
      .eq('learning_path_id', learningPathId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get approval: ${error.message}`);
    }

    return this._mapToPathApproval(data);
  }

  /**
   * Get pending approvals for a decision maker
   * @param {string} decisionMakerId
   * @returns {Promise<Array<PathApproval>>}
   */
  async getPendingApprovalsByDecisionMaker(decisionMakerId) {
    const { data, error } = await this.client
      .from('path_approvals')
      .select('*')
      .eq('decision_maker_id', decisionMakerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get pending approvals: ${error.message}`);
    }

    return data.map(item => this._mapToPathApproval(item));
  }

  /**
   * Update approval status
   * @param {string} approvalId
   * @param {Object} updates - { status, feedback, approvedAt?, rejectedAt? }
   * @returns {Promise<PathApproval>}
   */
  async updateApproval(approvalId, updates) {
    const updateData = {
      status: updates.status,
      feedback: updates.feedback || null
    };

    if (updates.status === 'approved') {
      updateData.approved_at = updates.approvedAt || new Date().toISOString();
      updateData.rejected_at = null;
    } else if (updates.status === 'rejected') {
      updateData.rejected_at = updates.rejectedAt || new Date().toISOString();
      updateData.approved_at = null;
    }

    const { data, error } = await this.client
      .from('path_approvals')
      .update(updateData)
      .eq('id', approvalId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update approval: ${error.message}`);
    }

    return this._mapToPathApproval(data);
  }

  /**
   * Delete approval
   * @param {string} approvalId
   * @returns {Promise<boolean>}
   */
  async deleteApproval(approvalId) {
    const { error } = await this.client
      .from('path_approvals')
      .delete()
      .eq('id', approvalId);

    if (error) {
      throw new Error(`Failed to delete approval: ${error.message}`);
    }

    return true;
  }

  /**
   * Map database record to PathApproval entity
   * @private
   */
  _mapToPathApproval(record) {
    return new PathApproval({
      id: record.id,
      learningPathId: record.learning_path_id,
      companyId: record.company_id,
      decisionMakerId: record.decision_maker_id,
      status: record.status,
      feedback: record.feedback,
      approvedAt: record.approved_at,
      rejectedAt: record.rejected_at,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    });
  }
}

