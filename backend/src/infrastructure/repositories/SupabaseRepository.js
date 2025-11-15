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
    // Note: learningPathId is actually competency_target_name (primary key of courses table)
    const { data, error } = await this.client
      .from('courses')
      .select('*')
      .eq('competency_target_name', learningPathId)
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
      .from('courses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get learning paths: ${error.message}`);
    }

    return data.map(item => this._mapToLearningPath(item));
  }

  /**
   * Save learning path to database
   */
  async saveLearningPath(learningPath) {
    // Store complete path data in JSONB format (courses table uses learning_path column)
    const pathData = {
      pathSteps: learningPath.pathSteps,
      pathTitle: learningPath.pathTitle,
      totalDurationHours: learningPath.totalDurationHours,
      learningModules: learningPath.pathMetadata?.learning_modules || null,
      metadata: learningPath.pathMetadata,
      companyId: learningPath.companyId,
      competencyTargetName: learningPath.competencyTargetName,
      status: learningPath.status
    };

    const { data, error } = await this.client
      .from('courses')
      .upsert({
        competency_target_name: learningPath.competencyTargetName || learningPath.id, // Primary key
        user_id: learningPath.userId,
        learning_path: pathData,
        approved: learningPath.status === 'completed',
        created_at: learningPath.createdAt,
        last_modified_at: learningPath.updatedAt
      }, {
        onConflict: 'competency_target_name'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save learning path: ${error.message}`);
    }

    return this._mapToLearningPath(data);
  }


  /**
   * Get learning paths for a company
   * Note: courses table doesn't have company_id, so we need to join with learners table
   */
  async getLearningPathsByCompany(companyId) {
    // First get all learners for this company
    const { data: learners, error: learnersError } = await this.client
      .from('learners')
      .select('user_id')
      .eq('company_id', companyId);

    if (learnersError) {
      throw new Error(`Failed to get learners: ${learnersError.message}`);
    }

    if (!learners || learners.length === 0) {
      return [];
    }

    const userIds = learners.map(l => l.user_id);

    // Then get all courses for these users
    const { data, error } = await this.client
      .from('courses')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get learning paths: ${error.message}`);
    }

    return data.map(item => this._mapToLearningPath(item));
  }

  /**
   * Map database record to LearningPath entity
   * Maps from courses table structure to LearningPath entity
   */
  _mapToLearningPath(record) {
    const pathData = record.learning_path || {};
    return new LearningPath({
      id: record.competency_target_name, // Primary key is competency_target_name
      userId: record.user_id,
      companyId: pathData.companyId || null, // May be stored in learning_path JSONB
      competencyTargetName: record.competency_target_name,
      pathSteps: pathData.pathSteps || [],
      pathTitle: pathData.pathTitle || null,
      totalDurationHours: pathData.totalDurationHours || null,
      pathMetadata: pathData.metadata || pathData,
      learning_path: record.learning_path, // Direct access to learning_path JSONB
      status: record.approved ? 'completed' : (pathData.status || 'pending'),
      createdAt: record.created_at,
      updatedAt: record.last_modified_at || record.created_at
    });
  }
}

