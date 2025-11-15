/**
 * Job Domain Entity
 * Represents an asynchronous job for learning path generation
 */
export class Job {
  constructor({
    id,
    userId,
    companyId,
    competencyTargetName,
    type, // 'path-generation', 'course-suggestion', etc.
    status = 'pending', // pending, processing, completed, failed
    progress = 0, // 0-100
    currentStage = null,
    result = null,
    error = null,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.userId = userId;
    this.companyId = companyId;
    this.competencyTargetName = competencyTargetName;
    this.type = type;
    this.status = status;
    this.progress = progress;
    this.currentStage = currentStage;
    this.result = result;
    this.error = error;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  /**
   * Update job progress
   */
  updateProgress(progress, stage = null) {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    this.progress = progress;
    if (stage) {
      this.currentStage = stage;
    }
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Mark job as processing
   */
  markProcessing(stage = null) {
    this.status = 'processing';
    if (stage) {
      this.currentStage = stage;
    }
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Mark job as completed
   */
  markCompleted(result) {
    this.status = 'completed';
    this.progress = 100;
    this.result = result;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Mark job as failed
   */
  markFailed(error) {
    this.status = 'failed';
    this.error = error;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Convert to plain object
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      companyId: this.companyId,
      competencyTargetName: this.competencyTargetName,
      type: this.type,
      status: this.status,
      progress: this.progress,
      currentStage: this.currentStage,
      result: this.result,
      error: this.error,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

