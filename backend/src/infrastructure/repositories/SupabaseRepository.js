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
    // CRITICAL: Enforce field order from Prompt 3: module_order → module_title → estimated_duration_hours → skills_in_module → steps
    const learningModules = (pathMetadata.learning_modules || learningPath.pathSteps || []).map(module => {
      // Build module in EXACT order from Prompt 3 specification
      const cleanModule = {};
      
      // Field 1: module_order (MUST be first)
      cleanModule.module_order = module.module_order;
      
      // Field 2: module_title (MUST be second)
      cleanModule.module_title = module.module_title;
      
      // Field 3: estimated_duration_hours (MUST be third)
      cleanModule.estimated_duration_hours = module.estimated_duration_hours;
      
      // Field 4: skills_in_module (MUST be fourth) - only add if not empty
      const skillsInModule = Array.isArray(module.skills_in_module) ? module.skills_in_module : [];
      if (skillsInModule.length > 0) {
        cleanModule.skills_in_module = skillsInModule;
      }
      
      // Field 5: steps (MUST be last) - only add if present
      if (Array.isArray(module.steps) && module.steps.length > 0) {
        cleanModule.steps = module.steps.map(step => {
          // Build step in EXACT order: step → title → description → estimatedTime → skills_covered
          const cleanStep = {};
          cleanStep.step = step.step;
          cleanStep.title = step.title;
          cleanStep.description = step.description;
          cleanStep.estimatedTime = step.estimatedTime;
          cleanStep.skills_covered = Array.isArray(step.skills_covered) ? step.skills_covered : [];
          return cleanStep;
        });
      }
      
      return cleanModule;
    });
    
    // Build pathData with EXACT Prompt 3 structure - enforce field order!
    // Prompt 3 specifies: path_title → learner_id → total_estimated_duration_hours → learning_modules
    const pathData = {};
    
    // Field 1: path_title (MUST be first)
    pathData.path_title = pathMetadata.path_title || learningPath.pathTitle || pathMetadata.pathTitle || 'Learning Path';
    
    // Field 2: learner_id (MUST be second)
    pathData.learner_id = pathMetadata.learner_id || learningPath.userId;
    
    // Field 3: total_estimated_duration_hours (MUST be third)
    pathData.total_estimated_duration_hours = pathMetadata.total_estimated_duration_hours || learningPath.totalDurationHours || pathMetadata.totalDurationHours || 0;
    
    // Field 4: learning_modules (MUST be last)
    pathData.learning_modules = learningModules;
    
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
   * Reorder learning_path JSON to match Prompt 3 field order
   * Ensures consistent field order when reading from database
   * @private
   */
  _reorderLearningPath(pathData) {
    if (!pathData || typeof pathData !== 'object') {
      return pathData;
    }

    // Reorder root level: path_title → learner_id → total_estimated_duration_hours → learning_modules
    const reordered = {};
    
    if (pathData.path_title !== undefined) {
      reordered.path_title = pathData.path_title;
    }
    if (pathData.learner_id !== undefined) {
      reordered.learner_id = pathData.learner_id;
    }
    if (pathData.total_estimated_duration_hours !== undefined) {
      reordered.total_estimated_duration_hours = pathData.total_estimated_duration_hours;
    }
    
    // Reorder learning_modules
    if (pathData.learning_modules && Array.isArray(pathData.learning_modules)) {
      reordered.learning_modules = pathData.learning_modules.map(module => {
        // Reorder module: module_order → module_title → estimated_duration_hours → skills_in_module → steps
        const reorderedModule = {};
        
        if (module.module_order !== undefined) {
          reorderedModule.module_order = module.module_order;
        }
        if (module.module_title !== undefined) {
          reorderedModule.module_title = module.module_title;
        }
        if (module.estimated_duration_hours !== undefined) {
          reorderedModule.estimated_duration_hours = module.estimated_duration_hours;
        }
        if (module.skills_in_module !== undefined && Array.isArray(module.skills_in_module)) {
          reorderedModule.skills_in_module = module.skills_in_module;
        }
        if (module.steps !== undefined && Array.isArray(module.steps)) {
          reorderedModule.steps = module.steps.map(step => {
            // Reorder step: step → title → description → estimatedTime → skills_covered
            const reorderedStep = {};
            if (step.step !== undefined) reorderedStep.step = step.step;
            if (step.title !== undefined) reorderedStep.title = step.title;
            if (step.description !== undefined) reorderedStep.description = step.description;
            if (step.estimatedTime !== undefined) reorderedStep.estimatedTime = step.estimatedTime;
            if (step.skills_covered !== undefined) reorderedStep.skills_covered = step.skills_covered;
            return reorderedStep;
          });
        }
        
        return reorderedModule;
      });
    }
    
    return reordered;
  }

  /**
   * Map database record to LearningPath entity
   * Maps from courses table structure to LearningPath entity
   * Reads from Prompt 3 structure (snake_case) in learning_path JSONB
   * Reorders fields to match Prompt 3 specification
   */
  _mapToLearningPath(record) {
    let pathData = record.learning_path || {};
    
    // Reorder learning_path to match Prompt 3 field order
    pathData = this._reorderLearningPath(pathData);
    
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
      pathMetadata: pathData, // Store the reordered Prompt 3 structure
      learning_path: pathData, // Store reordered learning_path JSONB
      status: record.approved ? 'approved' : 'pending', // Status comes from courses.approved, not learning_path JSONB
      createdAt: record.created_at,
      updatedAt: record.last_modified_at || record.created_at
    });
  }
}

