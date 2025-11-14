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
        exam_status: gapData.exam_status || null,
        competency_target_name: gapData.competency_target_name || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create skills gap: ${error.message}`);
    }

    return this._mapToSkillsGap(data);
  }

  /**
   * Get all skills gaps
   * @returns {Promise<Array<Object>>}
   */
  async getAllSkillsGaps() {
    const { data, error } = await this.client
      .from('skills_gap')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get skills gaps: ${error.message}`);
    }

    return data.map(item => this._mapToSkillsGap(item));
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
   * Get skills gaps by competency_target_name
   * @param {string} competencyTargetName
   * @returns {Promise<Array<Object>>}
   */
  async getSkillsGapsByCompetency(competencyTargetName) {
    const { data, error } = await this.client
      .from('skills_gap')
      .select('*')
      .eq('competency_target_name', competencyTargetName)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get skills gaps: ${error.message}`);
    }

    return data.map(item => this._mapToSkillsGap(item));
  }

  /**
   * Legacy method: Get skills gaps by course_id (deprecated, use getSkillsGapsByCompetency)
   * @param {string} courseId
   * @returns {Promise<Array<Object>>}
   */
  async getSkillsGapsByCourse(courseId) {
    return this.getSkillsGapsByCompetency(courseId);
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
    if (updates.exam_status !== undefined) updateData.exam_status = updates.exam_status;
    if (updates.competency_target_name !== undefined) updateData.competency_target_name = updates.competency_target_name;
    if (updates.company_name !== undefined) updateData.company_name = updates.company_name;
    if (updates.user_name !== undefined) updateData.user_name = updates.user_name;
    // Legacy support
    if (updates.test_status !== undefined) updateData.exam_status = updates.test_status;
    if (updates.course_id !== undefined) updateData.competency_target_name = updates.course_id;

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
   * Get skills gap by user_id and course_id (for cache updates)
   * @param {string} userId
   * @param {string} courseId
   * @returns {Promise<Object|null>}
   */
  /**
   * Get skills gap by user_id and competency_target_name
   * @param {string} userId
   * @param {string} competencyTargetName
   * @returns {Promise<Object|null>}
   */
  async getSkillsGapByUserAndCompetency(userId, competencyTargetName) {
    const { data, error } = await this.client
      .from('skills_gap')
      .select('*')
      .eq('user_id', userId)
      .eq('competency_target_name', competencyTargetName)
      .order('created_at', { ascending: false })
      .limit(1)
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
   * @deprecated Use getSkillsGapByUserAndCompetency instead
   */
  async getSkillsGapByUserAndCourse(userId, courseId) {
    // Legacy method - redirect to competency-based lookup if courseId matches competency pattern
    return this.getSkillsGapByUserAndCompetency(userId, courseId);
  }

  /**
   * Update skills gap cache by filtering skills_raw_data
   * Removes skills that are NOT in the new gap, keeps only skills in the new gap
   * @param {string} gapId
   * @param {Object} newGap - New gap data from Skills Engine
   * @returns {Promise<Object>}
   */
  async updateSkillsGapCache(gapId, newGap) {
    // Get existing gap
    const existingGap = await this.getSkillsGapById(gapId);
    if (!existingGap) {
      throw new Error(`Skills gap not found: ${gapId}`);
    }

    // Extract skill IDs from new gap
    const newSkillIds = this._extractSkillIds(newGap);

    // Filter existing skills_raw_data - keep only skills in new gap
    const filteredSkills = this._filterSkillsByIds(
      existingGap.skills_raw_data,
      newSkillIds
    );

    // Update the record
    return await this.updateSkillsGap(gapId, {
      skills_raw_data: filteredSkills
    });
  }

  /**
   * Extract skill IDs from gap data structure
   * @private
   */
  _extractSkillIds(gapData) {
    const skillIds = [];
    if (!gapData || typeof gapData !== 'object') return skillIds;

    if (gapData.identifiedGaps && Array.isArray(gapData.identifiedGaps)) {
      gapData.identifiedGaps.forEach(gap => {
        if (gap.microSkills && Array.isArray(gap.microSkills)) {
          gap.microSkills.forEach(skill => {
            if (skill && (skill.id || skill.skill_id)) {
              skillIds.push(skill.id || skill.skill_id);
            }
          });
        }
        if (gap.nanoSkills && Array.isArray(gap.nanoSkills)) {
          gap.nanoSkills.forEach(skill => {
            if (skill && (skill.id || skill.skill_id)) {
              skillIds.push(skill.id || skill.skill_id);
            }
          });
        }
      });
    }

    return skillIds;
  }

  /**
   * Filter existing skills to keep only those in newSkillIds
   * @private
   */
  _filterSkillsByIds(existingSkills, newSkillIds) {
    if (!existingSkills || typeof existingSkills !== 'object') {
      return existingSkills;
    }

    if (!existingSkills.identifiedGaps || !Array.isArray(existingSkills.identifiedGaps)) {
      return existingSkills;
    }

    const filtered = {
      ...existingSkills,
      identifiedGaps: existingSkills.identifiedGaps.map(gap => ({
        ...gap,
        microSkills: (gap.microSkills || []).filter(skill => {
          const skillId = skill?.id || skill?.skill_id;
          return skillId && newSkillIds.includes(skillId);
        }),
        nanoSkills: (gap.nanoSkills || []).filter(skill => {
          const skillId = skill?.id || skill?.skill_id;
          return skillId && newSkillIds.includes(skillId);
        })
      })).filter(gap => 
        (gap.microSkills?.length > 0) || (gap.nanoSkills?.length > 0)
      )
    };

    return filtered;
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
      exam_status: record.exam_status || record.test_status, // Support both
      competency_target_name: record.competency_target_name || record.course_id, // Support both
      created_at: record.created_at,
      last_modified_at: record.last_modified_at
    };
  }
}

