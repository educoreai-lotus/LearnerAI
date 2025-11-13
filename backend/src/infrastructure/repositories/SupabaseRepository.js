import { createClient } from '@supabase/supabase-js';
import { LearningPath } from '../../domain/entities/LearningPath.js';

/**
 * SupabaseRepository
 * Handles all database operations using Supabase
 */
export class SupabaseRepository {
  constructor(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get learning path by ID
   * @param {string} learningPathId
   * @returns {Promise<LearningPath|null>}
   */
  async getLearningPathById(learningPathId) {
    const { data, error } = await this.client
      .from('learning_paths')
      .select('*')
      .eq('id', learningPathId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get learning path: ${error.message}`);
    }

    return this._mapToLearningPath(data);
  }

  /**
   * Get all learning paths for a user
   * @param {string} userId
   * @returns {Promise<Array<LearningPath>>}
   */
  async getLearningPathsByUser(userId) {
    const { data, error } = await this.client
      .from('learning_paths')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get learning paths: ${error.message}`);
    }

    return data.map(item => this._mapToLearningPath(item));
  }

  /**
   * Save learning path to database
   */
  async saveLearningPath(learningPath) {
    // Store complete path data in JSONB format
    const pathData = {
      pathSteps: learningPath.pathSteps,
      pathTitle: learningPath.pathTitle,
      totalDurationHours: learningPath.totalDurationHours,
      learningModules: learningPath.pathMetadata?.learning_modules || null,
      metadata: learningPath.pathMetadata
    };

    const { data, error } = await this.client
      .from('learning_paths')
      .upsert({
        id: learningPath.id,
        user_id: learningPath.userId,
        company_id: learningPath.companyId,
        course_id: learningPath.courseId,
        gap_id: learningPath.courseId, // Using courseId as gap_id for now
        path_data: pathData,
        status: learningPath.status === 'completed' ? 'active' : 'active',
        created_at: learningPath.createdAt,
        updated_at: learningPath.updatedAt
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save learning path: ${error.message}`);
    }

    return this._mapToLearningPath(data);
  }

  /**
   * Get learning path by ID
   */
  async getLearningPath(id) {
    const { data, error } = await this.client
      .from('learning_paths')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get learning path: ${error.message}`);
    }

    return data ? this._mapToLearningPath(data) : null;
  }

  /**
   * Get all learning paths for a user
   */
  async getLearningPathsByUser(userId) {
    const { data, error } = await this.client
      .from('learning_paths')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get learning paths: ${error.message}`);
    }

    return data.map(item => this._mapToLearningPath(item));
  }

  /**
   * Get learning paths for a company
   */
  async getLearningPathsByCompany(companyId) {
    const { data, error } = await this.client
      .from('learning_paths')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get learning paths: ${error.message}`);
    }

    return data.map(item => this._mapToLearningPath(item));
  }

  /**
   * Map database record to LearningPath entity
   */
  _mapToLearningPath(record) {
    const pathData = record.path_data || {};
    return new LearningPath({
      id: record.id,
      userId: record.user_id,
      companyId: record.company_id,
      courseId: record.course_id,
      pathSteps: pathData.pathSteps || [],
      pathTitle: pathData.pathTitle || null,
      totalDurationHours: pathData.totalDurationHours || null,
      pathMetadata: pathData.metadata || pathData,
      status: record.status === 'active' ? 'completed' : record.status,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    });
  }
}

