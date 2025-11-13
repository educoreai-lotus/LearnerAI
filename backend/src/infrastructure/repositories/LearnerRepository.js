import { createClient } from '@supabase/supabase-js';

/**
 * LearnerRepository
 * Handles all database operations for learners table
 */
export class LearnerRepository {
  constructor(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new learner
   * @param {Object} learnerData
   * @returns {Promise<Object>}
   */
  async createLearner(learnerData) {
    const { data, error } = await this.client
      .from('learners')
      .insert({
        user_id: learnerData.user_id || undefined,
        company_id: learnerData.company_id,
        company_name: learnerData.company_name,
        user_name: learnerData.user_name,
        decision_maker_policy: learnerData.decision_maker_policy,
        decision_maker_id: learnerData.decision_maker_id || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create learner: ${error.message}`);
    }

    return this._mapToLearner(data);
  }

  /**
   * Get learner by user_id
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async getLearnerById(userId) {
    const { data, error } = await this.client
      .from('learners')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get learner: ${error.message}`);
    }

    return this._mapToLearner(data);
  }

  /**
   * Get all learners by company_id
   * @param {string} companyId
   * @returns {Promise<Array<Object>>}
   */
  async getLearnersByCompany(companyId) {
    const { data, error } = await this.client
      .from('learners')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get learners: ${error.message}`);
    }

    return data.map(item => this._mapToLearner(item));
  }

  /**
   * Update learner
   * @param {string} userId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateLearner(userId, updates) {
    const { data, error } = await this.client
      .from('learners')
      .update({
        company_name: updates.company_name,
        user_name: updates.user_name,
        decision_maker_policy: updates.decision_maker_policy,
        decision_maker_id: updates.decision_maker_id
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update learner: ${error.message}`);
    }

    return this._mapToLearner(data);
  }

  /**
   * Delete learner
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async deleteLearner(userId) {
    const { error } = await this.client
      .from('learners')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete learner: ${error.message}`);
    }

    return true;
  }

  /**
   * Map database record to learner object
   */
  _mapToLearner(record) {
    return {
      user_id: record.user_id,
      company_id: record.company_id,
      company_name: record.company_name,
      user_name: record.user_name,
      decision_maker_policy: record.decision_maker_policy,
      decision_maker_id: record.decision_maker_id,
      created_at: record.created_at,
      last_modified_at: record.last_modified_at
    };
  }
}

