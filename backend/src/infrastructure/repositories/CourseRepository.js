import { createClient } from '@supabase/supabase-js';

/**
 * CourseRepository
 * Handles all database operations for courses table
 */
export class CourseRepository {
  constructor(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new course
   * @param {Object} courseData
   * @returns {Promise<Object>}
   */
  async createCourse(courseData) {
    const { data, error } = await this.client
      .from('courses')
      .insert({
        competency_target_name: courseData.competency_target_name,
        user_id: courseData.user_id,
        learning_path: courseData.learning_path,
        approved: courseData.approved || false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create course: ${error.message}`);
    }

    return this._mapToCourse(data);
  }

  /**
   * Get all courses
   * @returns {Promise<Array<Object>>}
   */
  async getAllCourses() {
    const { data, error } = await this.client
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get courses: ${error.message}`);
    }

    return data.map(item => this._mapToCourse(item));
  }

  /**
   * Get course by competency_target_name
   * @param {string} competencyTargetName
   * @returns {Promise<Object|null>}
   */
  async getCourseById(competencyTargetName) {
    const { data, error } = await this.client
      .from('courses')
      .select('*')
      .eq('competency_target_name', competencyTargetName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get course: ${error.message}`);
    }

    return this._mapToCourse(data);
  }

  /**
   * Get all courses by user_id
   * @param {string} userId
   * @returns {Promise<Array<Object>>}
   */
  async getCoursesByUser(userId) {
    const { data, error } = await this.client
      .from('courses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get courses: ${error.message}`);
    }

    return data.map(item => this._mapToCourse(item));
  }

  /**
   * Get courses by approval status
   * @param {boolean} approved
   * @returns {Promise<Array<Object>>}
   */
  async getCoursesByApprovalStatus(approved) {
    const { data, error } = await this.client
      .from('courses')
      .select('*')
      .eq('approved', approved)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get courses: ${error.message}`);
    }

    return data.map(item => this._mapToCourse(item));
  }

  /**
   * Update course
   * @param {string} competencyTargetName
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateCourse(competencyTargetName, updates) {
    const updateData = {};
    if (updates.learning_path !== undefined) updateData.learning_path = updates.learning_path;
    if (updates.approved !== undefined) updateData.approved = updates.approved;

    const { data, error } = await this.client
      .from('courses')
      .update(updateData)
      .eq('competency_target_name', competencyTargetName)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update course: ${error.message}`);
    }

    return this._mapToCourse(data);
  }

  /**
   * Delete course
   * @param {string} competencyTargetName
   * @returns {Promise<boolean>}
   */
  async deleteCourse(competencyTargetName) {
    const { error } = await this.client
      .from('courses')
      .delete()
      .eq('competency_target_name', competencyTargetName);

    if (error) {
      throw new Error(`Failed to delete course: ${error.message}`);
    }

    return true;
  }

  /**
   * Map database record to course object
   */
  _mapToCourse(record) {
    return {
      competency_target_name: record.competency_target_name,
      user_id: record.user_id,
      learning_path: record.learning_path,
      approved: record.approved,
      created_at: record.created_at,
      last_modified_at: record.last_modified_at
    };
  }
}

