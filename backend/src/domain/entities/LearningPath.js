/**
 * LearningPath Domain Entity
 * Represents a complete learning path for a learner
 */
export class LearningPath {
  constructor({
    id,
    userId,
    companyId,
    courseId,
    pathSteps = [],
    pathTitle = null,
    totalDurationHours = null,
    pathMetadata = null,
    status = 'pending',
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.userId = userId;
    this.companyId = companyId;
    this.courseId = courseId;
    this.pathSteps = pathSteps; // Array of step objects or learning_modules
    this.pathTitle = pathTitle; // Title of the learning path
    this.totalDurationHours = totalDurationHours; // Total estimated duration
    this.pathMetadata = pathMetadata; // Full path metadata (for module-based format)
    this.status = status; // pending, processing, completed, failed
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  /**
   * Add a step to the learning path
   */
  addStep(step) {
    if (!step || !step.id || !step.title) {
      throw new Error('Step must have id and title');
    }
    this.pathSteps.push(step);
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Mark path as completed
   */
  markCompleted() {
    this.status = 'completed';
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Mark path as failed
   */
  markFailed(error) {
    this.status = 'failed';
    this.error = error;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Convert to plain object for storage
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      companyId: this.companyId,
      courseId: this.courseId,
      pathSteps: this.pathSteps,
      pathTitle: this.pathTitle,
      totalDurationHours: this.totalDurationHours,
      pathMetadata: this.pathMetadata,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

