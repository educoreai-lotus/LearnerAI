import { createClient } from '@supabase/supabase-js';
import { Job } from '../../domain/entities/Job.js';

/**
 * JobRepository
 * Handles job status tracking in Supabase
 */
export class JobRepository {
  constructor(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new job
   */
  async createJob(job) {
    const { data, error } = await this.client
      .from('jobs')
      .insert({
        id: job.id,
        user_id: job.userId,
        company_id: job.companyId,
        competency_target_name: job.competencyTargetName,
        type: job.type,
        status: job.status,
        progress: job.progress,
        current_stage: job.currentStage,
        created_at: job.createdAt,
        updated_at: job.updatedAt
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    return this._mapToJob(data);
  }

  /**
   * Update job
   */
  async updateJob(jobId, updates) {
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.currentStage !== undefined) updateData.current_stage = updates.currentStage;
    if (updates.result !== undefined) updateData.result = updates.result;
    if (updates.error !== undefined) updateData.error = updates.error;

    const { data, error } = await this.client
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update job: ${error.message}`);
    }

    return this._mapToJob(data);
  }

  /**
   * Get job by ID
   */
  async getJob(jobId) {
    const { data, error } = await this.client
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      throw new Error(`Failed to get job: ${error.message}`);
    }

    return data ? this._mapToJob(data) : null;
  }

  /**
   * Map database record to Job entity
   */
  _mapToJob(record) {
    return new Job({
      id: record.id,
      userId: record.user_id,
      companyId: record.company_id,
      competencyTargetName: record.competency_target_name,
      type: record.type,
      status: record.status,
      progress: record.progress || 0,
      currentStage: record.current_stage,
      result: record.result,
      error: record.error,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    });
  }
}

