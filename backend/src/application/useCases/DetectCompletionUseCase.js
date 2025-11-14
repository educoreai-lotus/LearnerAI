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
   * @param {string} completionData.courseId - Legacy support (completed course ID)
   * @param {boolean} completionData.passed - Whether the course was passed
   * @param {Object} completionData.completionDetails - Additional completion details
   * @returns {Promise<Object>} Result with job ID for async suggestion generation
   */
  async execute(completionData) {
    const { userId, competencyTargetName, courseId, passed, completionDetails = {} } = completionData;

    const competencyName = competencyTargetName || courseId;

    // Validate required fields
    if (!userId || !competencyName) {
      throw new Error('userId and competencyTargetName (or courseId) are required');
    }

    // Only process successful completions
    if (!passed) {
      return {
        processed: false,
        message: 'Course not passed - no suggestions generated',
        userId,
        competencyTargetName: competencyName,
        courseId: competencyName // Legacy support
      };
    }

    // Generate course suggestions asynchronously
    const result = await this.generateCourseSuggestionsUseCase.execute({
      userId,
      completedCourseId: competencyName,
      completionDate: new Date().toISOString(),
      completionDetails
    });

    return {
      processed: true,
      message: 'Course completion detected - suggestions generation started',
      userId,
      competencyTargetName: competencyName,
      courseId: competencyName, // Legacy support
      jobId: result.jobId,
      status: result.status
    };
  }
}

