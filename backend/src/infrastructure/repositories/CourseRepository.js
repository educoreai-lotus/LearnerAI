import { createClient } from '@supabase/supabase-js';
import { pickUniqueCourseOrThrow } from '../../utils/courseIdentity.js';

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
        gap_id: courseData.gap_id || null,
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
   * LEGACY TARGET-ONLY LOOKUP.
   * Target is not unique. 0 -> null, 1 -> that course, >1 -> AMBIGUOUS_COURSE_TARGET.
   * Do not use for personalized reads when course_id or user+target is available.
   * @param {string} competencyTargetName
   * @returns {Promise<Object|null>}
   */
  async getCourseById(competencyTargetName) {
    const { data, error } = await this.client
      .from('courses')
      .select('*')
      .eq('competency_target_name', competencyTargetName);

    if (error) {
      throw new Error(`Failed to get course: ${error.message}`);
    }

    const row = pickUniqueCourseOrThrow(data, competencyTargetName);
    return row ? this._mapToCourse(row) : null;
  }

  /**
   * Get the course owned by this user for this competency target.
   * Both filters are applied in the database query.
   * @param {string} userId
   * @param {string} competencyTargetName
   * @returns {Promise<Object|null>}
   */
  async getCourseByUserAndTarget(userId, competencyTargetName) {
    const { data, error } = await this.client
      .from('courses')
      .select('*')
      .eq('user_id', userId)
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
   * Get course by internal course_id (Phase A identity)
   * @param {string} courseId
   * @returns {Promise<Object|null>}
   */
  async getCourseByCourseId(courseId) {
    if (!courseId) {
      return null;
    }

    const { data, error } = await this.client
      .from('courses')
      .select('*')
      .eq('course_id', courseId)
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
   * Update course by internal course_id.
   * Preferred write identity after Phase A.
   * @param {string} courseId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateCourseById(courseId, updates) {
    if (!courseId) {
      throw new Error('courseId is required to update a course by id');
    }

    const { data, error } = await this.client
      .from('courses')
      .update(this._buildUpdateData(updates))
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update course: ${error.message}`);
    }

    return this._mapToCourse(data);
  }

  /**
   * Update the course owned by this user for this competency target.
   * @param {string} userId
   * @param {string} competencyTargetName
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateCourseByUserAndTarget(userId, competencyTargetName, updates) {
    if (!userId || !competencyTargetName) {
      throw new Error('userId and competencyTargetName are required');
    }

    const { data, error } = await this.client
      .from('courses')
      .update(this._buildUpdateData(updates))
      .eq('user_id', userId)
      .eq('competency_target_name', competencyTargetName)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update course: ${error.message}`);
    }

    return this._mapToCourse(data);
  }

  /**
   * LEGACY TARGET-ONLY UPDATE.
   * Resolves 0/1/>1. Multiple matches throw AMBIGUOUS_COURSE_TARGET.
   * Mutates only the resolved course_id — never all same-target rows.
   * @param {string} competencyTargetName
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateCourse(competencyTargetName, updates) {
    const existing = await this.getCourseById(competencyTargetName);
    if (!existing?.course_id) {
      throw new Error(`Failed to update course: no unique course for target "${competencyTargetName}"`);
    }
    return await this.updateCourseById(existing.course_id, updates);
  }

  /**
   * Delete course by internal course_id.
   * Preferred destructive identity — never deletes another user's same-target row.
   * @param {string} courseId
   * @returns {Promise<boolean>}
   */
  async deleteCourseById(courseId) {
    if (!courseId) {
      throw new Error('courseId is required to delete a course by id');
    }

    const { error } = await this.client
      .from('courses')
      .delete()
      .eq('course_id', courseId);

    if (error) {
      throw new Error(`Failed to delete course: ${error.message}`);
    }

    return true;
  }

  /**
   * Delete the course owned by this user for this competency target.
   * @param {string} userId
   * @param {string} competencyTargetName
   * @returns {Promise<boolean>}
   */
  async deleteCourseByUserAndTarget(userId, competencyTargetName) {
    if (!userId || !competencyTargetName) {
      throw new Error('userId and competencyTargetName are required');
    }

    const { error } = await this.client
      .from('courses')
      .delete()
      .eq('user_id', userId)
      .eq('competency_target_name', competencyTargetName);

    if (error) {
      throw new Error(`Failed to delete course: ${error.message}`);
    }

    return true;
  }

  /**
   * LEGACY TARGET-ONLY DELETE.
   * Resolves 0/1/>1. Multiple matches throw AMBIGUOUS_COURSE_TARGET.
   * Deletes only the resolved course_id — never all same-target rows.
   * @param {string} competencyTargetName
   * @returns {Promise<boolean>}
   */
  async deleteCourse(competencyTargetName) {
    const existing = await this.getCourseById(competencyTargetName);
    if (!existing) {
      return true;
    }
    if (!existing.course_id) {
      throw new Error(`Failed to delete course: no unique course for target "${competencyTargetName}"`);
    }
    return await this.deleteCourseById(existing.course_id);
  }

  /**
   * @private
   */
  _buildUpdateData(updates) {
    const updateData = {};
    if (updates.learning_path !== undefined) updateData.learning_path = updates.learning_path;
    if (updates.approved !== undefined) updateData.approved = updates.approved;
    if (updates.gap_id !== undefined) updateData.gap_id = updates.gap_id;
    return updateData;
  }

  /**
   * Map database record to course object
   */
  _mapToCourse(record) {
    return {
      course_id: record.course_id || null,
      competency_target_name: record.competency_target_name,
      user_id: record.user_id,
      gap_id: record.gap_id,
      learning_path: record.learning_path,
      approved: record.approved,
      created_at: record.created_at,
      last_modified_at: record.last_modified_at
    };
  }
}

