/**
 * DetectCompletionUseCase
 * Handles course completion detection from Skills Engine
 */
export class DetectCompletionUseCase {
  constructor({ generateCourseSuggestionsUseCase, jobRepository }) {
    this.generateCourseSuggestionsUseCase = generateCourseSuggestionsUseCase;
    this.jobRepository = jobRepository;
  }

  /**
   * Process completion event from Skills Engine
   * @param {Object} completionData
   * @param {string} completionData.userId - User ID
   * @param {string} completionData.competencyTargetName - Completed competency name
   * @param {boolean} completionData.passed - Whether the course was passed
   * @param {Object} completionData.completionDetails - Additional completion details
   * @returns {Promise<Object>} Result with job ID for async suggestion generation
   */
  async execute(completionData) {
    const { userId, competencyTargetName, passed, completionDetails = {} } = completionData;

    // Validate required fields
    if (!userId || !competencyTargetName) {
      throw new Error('userId and competencyTargetName are required');
    }

    // Only process successful completions
    if (!passed) {
      return {
        processed: false,
        message: 'Course not passed - no suggestions generated',
        userId,
        competencyTargetName
      };
    }

    // Generate course suggestions asynchronously
    const result = await this.generateCourseSuggestionsUseCase.execute({
      userId,
      competencyTargetName,
      completionDate: new Date().toISOString(),
      completionDetails
    });

    return {
      processed: true,
      message: 'Course completion detected - suggestions generation started',
      userId,
      competencyTargetName,
      jobId: result.jobId,
      status: result.status
    };
  }
}

