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
    // CRITICAL: Save ONLY the exact structure from Prompt 3 - EXACTLY 4 fields, nothing else!
    const pathMetadata = learningPath.pathMetadata || {};
    
    // Extract and clean learning_modules to remove ALL extra fields
    const learningModules = (pathMetadata.learning_modules || learningPath.pathSteps || []).map(module => {
      // Return ONLY the 5 fields from Prompt 3 module structure
      const cleanModule = {
        module_order: module.module_order,
        module_title: module.module_title,
        estimated_duration_hours: module.estimated_duration_hours,
        skills_in_module: Array.isArray(module.skills_in_module) ? module.skills_in_module : [],
        steps: Array.isArray(module.steps) ? module.steps.map(step => {
          // Return ONLY the 5 fields from Prompt 3 step structure
          return {
            step: step.step,
            title: step.title,
            description: step.description,
            estimatedTime: step.estimatedTime,
            skills_covered: Array.isArray(step.skills_covered) ? step.skills_covered : []
          };
        }) : []
      };
      
      // Remove empty arrays (but keep them if they have content)
      if (cleanModule.skills_in_module.length === 0) {
        delete cleanModule.skills_in_module;
      }
      if (cleanModule.steps.length === 0) {
        delete cleanModule.steps;
      }
      
      return cleanModule;
    });
    
    // Build pathData with EXACT Prompt 3 structure - ONLY these 4 fields!
    const pathData = {
      path_title: pathMetadata.path_title || learningPath.pathTitle || pathMetadata.pathTitle || 'Learning Path',
      learner_id: pathMetadata.learner_id || learningPath.userId,
      total_estimated_duration_hours: pathMetadata.total_estimated_duration_hours || learningPath.totalDurationHours || pathMetadata.totalDurationHours || 0,
      learning_modules: learningModules
    };
    
    // NO OTHER FIELDS! Remove any undefined/null values just to be safe
    Object.keys(pathData).forEach(key => {
      if (pathData[key] === undefined || pathData[key] === null) {
        delete pathData[key];
      }
    });

    // Build upsert data - let database handle timestamps to avoid timezone issues
    const upsertData = {
      competency_target_name: learningPath.competencyTargetName || learningPath.id, // Primary key
      user_id: learningPath.userId,
      gap_id: learningPath.gapId || null, // Link to original skills gap
      learning_path: pathData,
      approved: learningPath.status === 'approved' || learningPath.status === 'completed'
    };
    
    // Only set created_at if this is a NEW record (not updating existing)
    // For updates, PostgreSQL will preserve the existing created_at value
    // For new records, database DEFAULT NOW() will handle it, but we can also preserve
    // the original created_at if provided (for consistency)
    // Note: last_modified_at is handled by database trigger automatically
    
    // Check if this is an update by checking if record exists
    // If updating, don't set created_at (preserve original)
    // If new, let database DEFAULT NOW() handle it (or use provided value)
    // For simplicity, let database always use DEFAULT NOW() for new records
    // and preserve existing created_at for updates (by not including it in upsert)
    
    const { data, error } = await this.client
      .from('courses')
      .upsert(upsertData, {
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
   * Reads from Prompt 3 structure (snake_case) in learning_path JSONB
   */
  _mapToLearningPath(record) {
    const pathData = record.learning_path || {};
    
    // Read from Prompt 3 structure (snake_case) - primary format
    const pathTitle = pathData.path_title || pathData.pathTitle || null;
    const totalDurationHours = pathData.total_estimated_duration_hours || pathData.totalDurationHours || null;
    const learningModules = pathData.learning_modules || pathData.pathSteps || [];
    
    return new LearningPath({
      id: record.competency_target_name, // Primary key is competency_target_name
      userId: record.user_id || pathData.learner_id || null,
      companyId: null, // NOT stored in learning_path JSONB (stored in courses table via user_id -> learners table)
      competencyTargetName: record.competency_target_name,
      gapId: record.gap_id || null, // Link to original skills gap
      pathSteps: learningModules, // learning_modules array
      pathTitle: pathTitle,
      totalDurationHours: totalDurationHours,
      pathMetadata: pathData, // Store the exact Prompt 3 structure
      learning_path: record.learning_path, // Direct access to learning_path JSONB
      status: record.approved ? 'approved' : 'pending', // Status comes from courses.approved, not learning_path JSONB
      createdAt: record.created_at,
      updatedAt: record.last_modified_at || record.created_at
    });
  }
}

