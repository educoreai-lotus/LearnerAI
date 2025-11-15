import { createClient } from '@supabase/supabase-js';

/**
 * RecommendationRepository
 * Handles all database operations for recommendations table
 */
export class RecommendationRepository {
  constructor(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new recommendation
   * @param {Object} recommendationData
   * @returns {Promise<Object>}
   */
  async createRecommendation(recommendationData) {
    const { data, error } = await this.client
      .from('recommendations')
      .insert({
        recommendation_id: recommendationData.recommendation_id || undefined,
        user_id: recommendationData.user_id,
        base_course_name: recommendationData.base_course_name || null,
        suggested_courses: recommendationData.suggested_courses,
        sent_to_rag: recommendationData.sent_to_rag || false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create recommendation: ${error.message}`);
    }

    return this._mapToRecommendation(data);
  }

  /**
   * Get all recommendations
   * @returns {Promise<Array<Object>>}
   */
  async getAllRecommendations() {
    const { data, error } = await this.client
      .from('recommendations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }

    return data.map(item => this._mapToRecommendation(item));
  }

  /**
   * Get recommendation by recommendation_id
   * @param {string} recommendationId
   * @returns {Promise<Object|null>}
   */
  async getRecommendationById(recommendationId) {
    const { data, error } = await this.client
      .from('recommendations')
      .select('*')
      .eq('recommendation_id', recommendationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get recommendation: ${error.message}`);
    }

    return this._mapToRecommendation(data);
  }

  /**
   * Get all recommendations by user_id
   * @param {string} userId
   * @returns {Promise<Array<Object>>}
   */
  async getRecommendationsByUser(userId) {
    const { data, error } = await this.client
      .from('recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }

    return data.map(item => this._mapToRecommendation(item));
  }

  /**
   * Get recommendations by base_course_name
   * @param {string} baseCourseName
   * @returns {Promise<Array<Object>>}
   */
  async getRecommendationsByBaseCourse(baseCourseName) {
    const { data, error } = await this.client
      .from('recommendations')
      .select('*')
      .eq('base_course_name', baseCourseName)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }

    return data.map(item => this._mapToRecommendation(item));
  }

  /**
   * Get recommendations by sent_to_rag status
   * @param {boolean} sentToRag
   * @returns {Promise<Array<Object>>}
   */
  async getRecommendationsByRagStatus(sentToRag) {
    const { data, error } = await this.client
      .from('recommendations')
      .select('*')
      .eq('sent_to_rag', sentToRag)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }

    return data.map(item => this._mapToRecommendation(item));
  }

  /**
   * Update recommendation
   * @param {string} recommendationId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateRecommendation(recommendationId, updates) {
    const updateData = {};
    if (updates.base_course_name !== undefined) updateData.base_course_name = updates.base_course_name;
    if (updates.suggested_courses !== undefined) updateData.suggested_courses = updates.suggested_courses;
    if (updates.sent_to_rag !== undefined) updateData.sent_to_rag = updates.sent_to_rag;

    const { data, error } = await this.client
      .from('recommendations')
      .update(updateData)
      .eq('recommendation_id', recommendationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update recommendation: ${error.message}`);
    }

    return this._mapToRecommendation(data);
  }

  /**
   * Delete recommendation
   * @param {string} recommendationId
   * @returns {Promise<boolean>}
   */
  async deleteRecommendation(recommendationId) {
    const { error } = await this.client
      .from('recommendations')
      .delete()
      .eq('recommendation_id', recommendationId);

    if (error) {
      throw new Error(`Failed to delete recommendation: ${error.message}`);
    }

    return true;
  }

  /**
   * Map database record to recommendation object
   */
  _mapToRecommendation(record) {
    return {
      recommendation_id: record.recommendation_id,
      user_id: record.user_id,
      base_course_name: record.base_course_name,
      suggested_courses: record.suggested_courses,
      sent_to_rag: record.sent_to_rag,
      created_at: record.created_at,
      last_modified_at: record.last_modified_at
    };
  }
}

