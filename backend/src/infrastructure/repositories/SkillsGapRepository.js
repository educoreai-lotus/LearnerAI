import { createClient } from '@supabase/supabase-js';

/**
 * SkillsGapRepository
 * Handles all database operations for skills_gap table
 */
export class SkillsGapRepository {
  constructor(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new skills gap
   * @param {Object} gapData
   * @returns {Promise<Object>}
   */
  async createSkillsGap(gapData) {
    const { data, error } = await this.client
      .from('skills_gap')
      .insert({
        gap_id: gapData.gap_id || undefined,
        user_id: gapData.user_id,
        company_id: gapData.company_id,
        company_name: gapData.company_name,
        user_name: gapData.user_name,
        skills_raw_data: gapData.skills_raw_data,
        test_status: gapData.test_status || null,
        course_id: gapData.course_id || null,
        decision_maker_id: gapData.decision_maker_id || null,
        decision_maker_policy: gapData.decision_maker_policy || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create skills gap: ${error.message}`);
    }

    return this._mapToSkillsGap(data);
  }

  /**
   * Get skills gap by gap_id
   * @param {string} gapId
   * @returns {Promise<Object|null>}
   */
  async getSkillsGapById(gapId) {
    const { data, error } = await this.client
      .from('skills_gap')
      .select('*')
      .eq('gap_id', gapId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get skills gap: ${error.message}`);
    }

    return this._mapToSkillsGap(data);
  }

  /**
   * Get all skills gaps by user_id
   * @param {string} userId
   * @returns {Promise<Array<Object>>}
   */
  async getSkillsGapsByUser(userId) {
    const { data, error } = await this.client
      .from('skills_gap')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get skills gaps: ${error.message}`);
    }

    return data.map(item => this._mapToSkillsGap(item));
  }

  /**
   * Get skills gaps by company_id
   * @param {string} companyId
   * @returns {Promise<Array<Object>>}
   */
  async getSkillsGapsByCompany(companyId) {
    const { data, error } = await this.client
      .from('skills_gap')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get skills gaps: ${error.message}`);
    }

    return data.map(item => this._mapToSkillsGap(item));
  }

  /**
   * Get skills gaps by course_id
   * @param {string} courseId
   * @returns {Promise<Array<Object>>}
   */
  async getSkillsGapsByCourse(courseId) {
    const { data, error } = await this.client
      .from('skills_gap')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get skills gaps: ${error.message}`);
    }

    return data.map(item => this._mapToSkillsGap(item));
  }

  /**
   * Get skills gaps by test_status
   * @param {string} testStatus
   * @returns {Promise<Array<Object>>}
   */
  async getSkillsGapsByTestStatus(testStatus) {
    const { data, error } = await this.client
      .from('skills_gap')
      .select('*')
      .eq('test_status', testStatus)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get skills gaps: ${error.message}`);
    }

    return data.map(item => this._mapToSkillsGap(item));
  }

  /**
   * Update skills gap
   * @param {string} gapId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateSkillsGap(gapId, updates) {
    const updateData = {};
    if (updates.skills_raw_data !== undefined) updateData.skills_raw_data = updates.skills_raw_data;
    if (updates.test_status !== undefined) updateData.test_status = updates.test_status;
    if (updates.course_id !== undefined) updateData.course_id = updates.course_id;
    if (updates.decision_maker_id !== undefined) updateData.decision_maker_id = updates.decision_maker_id;
    if (updates.decision_maker_policy !== undefined) updateData.decision_maker_policy = updates.decision_maker_policy;

    const { data, error } = await this.client
      .from('skills_gap')
      .update(updateData)
      .eq('gap_id', gapId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update skills gap: ${error.message}`);
    }

    return this._mapToSkillsGap(data);
  }

  /**
   * Delete skills gap
   * @param {string} gapId
   * @returns {Promise<boolean>}
   */
  async deleteSkillsGap(gapId) {
    const { error } = await this.client
      .from('skills_gap')
      .delete()
      .eq('gap_id', gapId);

    if (error) {
      throw new Error(`Failed to delete skills gap: ${error.message}`);
    }

    return true;
  }

  /**
   * Map database record to skills gap object
   */
  _mapToSkillsGap(record) {
    return {
      gap_id: record.gap_id,
      user_id: record.user_id,
      company_id: record.company_id,
      company_name: record.company_name,
      user_name: record.user_name,
      skills_raw_data: record.skills_raw_data,
      test_status: record.test_status,
      course_id: record.course_id,
      decision_maker_id: record.decision_maker_id,
      decision_maker_policy: record.decision_maker_policy,
      created_at: record.created_at,
      last_modified_at: record.last_modified_at
    };
  }
}

