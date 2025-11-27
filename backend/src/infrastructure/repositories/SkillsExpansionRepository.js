import { createClient } from '@supabase/supabase-js';

/**
 * SkillsExpansionRepository
 * Handles all database operations for skills_expansions table
 */
export class SkillsExpansionRepository {
  constructor(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new skills expansion
   * @param {Object} expansionData
   * @returns {Promise<Object>}
   */
  async createSkillsExpansion(expansionData) {
    const { data, error } = await this.client
      .from('skills_expansions')
      .insert({
        expansion_id: expansionData.expansion_id || undefined,
        gap_id: expansionData.gap_id,
        user_id: expansionData.user_id,
        prompt_1_output: expansionData.prompt_1_output || null,
        prompt_2_output: expansionData.prompt_2_output || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create skills expansion: ${error.message}`);
    }

    return this._mapToSkillsExpansion(data);
  }

  /**
   * Get skills expansion by expansion_id
   * @param {string} expansionId
   * @returns {Promise<Object|null>}
   */
  async getSkillsExpansionById(expansionId) {
    const { data, error } = await this.client
      .from('skills_expansions')
      .select('*')
      .eq('expansion_id', expansionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get skills expansion: ${error.message}`);
    }

    return this._mapToSkillsExpansion(data);
  }

  /**
   * Get all skills expansions
   * @param {Object} options - Query options (limit, offset, user_id, gap_id)
   * @returns {Promise<Array<Object>>}
   */
  async getAllSkillsExpansions(options = {}) {
    let query = this.client
      .from('skills_expansions')
      .select('*');

    if (options.user_id) {
      query = query.eq('user_id', options.user_id);
    }
    if (options.gap_id) {
      query = query.eq('gap_id', options.gap_id);
    }

    query = query.order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get skills expansions: ${error.message}`);
    }

    return data.map(item => this._mapToSkillsExpansion(item));
  }

  /**
   * Get skills expansions by user_id
   * @param {string} userId
   * @returns {Promise<Array<Object>>}
   */
  async getSkillsExpansionsByUserId(userId) {
    return this.getAllSkillsExpansions({ user_id: userId });
  }

  /**
   * Get skills expansions by gap_id
   * @param {string} gapId
   * @returns {Promise<Array<Object>>}
   */
  async getSkillsExpansionsByGapId(gapId) {
    return this.getAllSkillsExpansions({ gap_id: gapId });
  }

  /**
   * Get most recent skills expansion for a gap_id (for update scenarios)
   * @param {string} gapId
   * @returns {Promise<Object|null>}
   */
  async getLatestSkillsExpansionByGapId(gapId) {
    const expansions = await this.getAllSkillsExpansions({ gap_id: gapId, limit: 1 });
    return expansions.length > 0 ? expansions[0] : null;
  }

  /**
   * Get most recent skills expansion for a user_id and gap_id
   * Useful for finding existing expansions when updating learning paths
   * @param {string} userId
   * @param {string} gapId
   * @returns {Promise<Object|null>}
   */
  async getLatestSkillsExpansionByUserAndGap(userId, gapId) {
    const { data, error } = await this.client
      .from('skills_expansions')
      .select('*')
      .eq('user_id', userId)
      .eq('gap_id', gapId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get skills expansion: ${error.message}`);
    }

    return this._mapToSkillsExpansion(data);
  }

  /**
   * Update skills expansion
   * @param {string} expansionId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateSkillsExpansion(expansionId, updates) {
    const updateData = {};
    if (updates.prompt_1_output !== undefined) updateData.prompt_1_output = updates.prompt_1_output;
    if (updates.prompt_2_output !== undefined) updateData.prompt_2_output = updates.prompt_2_output;
    if (updates.gap_id !== undefined) updateData.gap_id = updates.gap_id;
    if (updates.user_id !== undefined) updateData.user_id = updates.user_id;

    const { data, error } = await this.client
      .from('skills_expansions')
      .update(updateData)
      .eq('expansion_id', expansionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update skills expansion: ${error.message}`);
    }

    return this._mapToSkillsExpansion(data);
  }

  /**
   * Delete skills expansion
   * @param {string} expansionId
   * @returns {Promise<boolean>}
   */
  async deleteSkillsExpansion(expansionId) {
    const { error } = await this.client
      .from('skills_expansions')
      .delete()
      .eq('expansion_id', expansionId);

    if (error) {
      throw new Error(`Failed to delete skills expansion: ${error.message}`);
    }

    return true;
  }

  /**
   * Map database record to skills expansion object
   */
  _mapToSkillsExpansion(record) {
    return {
      expansion_id: record.expansion_id,
      gap_id: record.gap_id,
      user_id: record.user_id,
      prompt_1_output: record.prompt_1_output,
      prompt_2_output: record.prompt_2_output,
      created_at: record.created_at,
      last_modified_at: record.last_modified_at
    };
  }
}

