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
   * @param {Object} options - Query options (limit, offset)
   * @returns {Promise<Array<Object>>}
   */
  async getAllSkillsExpansions(options = {}) {
    let query = this.client
      .from('skills_expansions')
      .select('*')
      .order('created_at', { ascending: false });

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
   * Update skills expansion
   * @param {string} expansionId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateSkillsExpansion(expansionId, updates) {
    const updateData = {};
    if (updates.prompt_1_output !== undefined) updateData.prompt_1_output = updates.prompt_1_output;
    if (updates.prompt_2_output !== undefined) updateData.prompt_2_output = updates.prompt_2_output;

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
      prompt_1_output: record.prompt_1_output,
      prompt_2_output: record.prompt_2_output,
      created_at: record.created_at,
      last_modified_at: record.last_modified_at
    };
  }
}

