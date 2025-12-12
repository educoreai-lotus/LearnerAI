/**
 * DistributePathUseCase
 * Distributes learning path to Course Builder, Analytics, and Reports after approval
 */
export class DistributePathUseCase {
  constructor({ courseBuilderClient, analyticsClient, reportsClient, repository, skillsGapRepository }) {
    this.courseBuilderClient = courseBuilderClient;
    this.analyticsClient = analyticsClient;
    this.reportsClient = reportsClient;
    this.repository = repository;
    this.skillsGapRepository = skillsGapRepository;
  }

  /**
   * Distribute learning path to all microservices
   * @param {string} learningPathId - This is actually competency_target_name (primary key of courses table)
   * @returns {Promise<Object>} Distribution results
   */
  async execute(learningPathId) {
    // Get learning path from repository
    // Note: learningPathId is actually competency_target_name (primary key of courses table)
    const learningPath = await this.repository.getLearningPathById(learningPathId);
    if (!learningPath) {
      throw new Error(`Learning path ${learningPathId} not found`);
    }
    
    // Extract competency_target_name (it's the learningPathId)
    const competencyTargetName = learningPath.competencyTargetName || learningPathId;

    const results = {
      courseBuilder: null,
      analytics: null,
      reports: null,
      errors: []
    };

    // Send to Course Builder (with rollback)
    try {
      // Fetch skills gap data to get user_name and company_name
      if (!this.skillsGapRepository || !learningPath.userId || !competencyTargetName) {
        throw new Error('Missing required data: skillsGapRepository, userId, or competencyTargetName');
      }
      
      const skillsGap = await this.skillsGapRepository.getSkillsGapByUserAndCompetency(
        learningPath.userId,
        competencyTargetName
      );
      
      if (!skillsGap) {
        throw new Error(`Skills gap not found for user ${learningPath.userId}, competency ${competencyTargetName}`);
      }
      
      // Build Course Builder payload with required fields
      // Use learning_path JSONB directly (contains exact Prompt 3 structure)
      const learningPathData = learningPath.learning_path || learningPath.pathMetadata || {};
      const courseBuilderPayload = {
        user_id: learningPath.userId,
        user_name: skillsGap.user_name, // From skills_gap table
        company_id: skillsGap.company_id, // From skills_gap table
        company_name: skillsGap.company_name, // From skills_gap table
        competency_target_name: competencyTargetName,
        learning_path: learningPathData // Use exact Prompt 3 structure from database
      };
      
      // Send with rollback enabled (will return mock data if fails)
      results.courseBuilder = await this.courseBuilderClient.sendLearningPath(courseBuilderPayload, {
        maxRetries: 3,
        retryDelay: 1000,
        useRollback: true
      });
      
      if (results.courseBuilder.rollback) {
        console.warn(`⚠️ Course Builder unavailable, used rollback mock data: ${learningPathId}`);
        results.errors.push({ 
          service: 'courseBuilder', 
          error: 'Service unavailable - rollback mock data used',
          rollback: true 
        });
      } else {
        console.log(`✅ Learning path sent to Course Builder: ${learningPathId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to send to Course Builder: ${error.message}`);
      results.errors.push({ service: 'courseBuilder', error: error.message });
      // Even if error, try to get rollback data
      try {
        const learningPathData = learningPath.learning_path || learningPath.pathMetadata || {};
        const courseBuilderPayload = {
          user_id: learningPath.userId,
          competency_target_name: competencyTargetName,
          learning_path: learningPathData // Use exact Prompt 3 structure from database
        };
        results.courseBuilder = this.courseBuilderClient.getRollbackMockData(courseBuilderPayload);
        console.warn(`⚠️ Using rollback mock data for Course Builder`);
      } catch (rollbackError) {
        console.error(`❌ Failed to get rollback data: ${rollbackError.message}`);
      }
    }

    // Note: Learning Analytics no longer receives data automatically here.
    // Learning Analytics receives data in two ways:
    // 1. On-demand: Learning Analytics requests data via /api/fill-content-metrics
    // 2. Batch: Daily scheduled batch job sends all users data via analyticsClient.sendBatchAnalytics()
    // 
    // We no longer send to Analytics automatically when a path is generated.
    results.analytics = { message: 'Learning Analytics receives data via on-demand requests or daily batch, not automatically on path generation' };

    // Send to Reports (with rollback)
    try {
      // Use learning_path JSONB directly (contains exact Prompt 3 structure)
      const learningPathData = learningPath.learning_path || learningPath.pathMetadata || {};
      // Send with rollback enabled (will return mock data if fails)
      results.reports = await this.reportsClient.updatePathReports(learningPathData, {
        maxRetries: 3,
        retryDelay: 1000,
        useRollback: true
      });
      
      if (results.reports.rollback) {
        console.warn(`⚠️ Reports service unavailable, used rollback mock data: ${learningPathId}`);
        results.errors.push({ 
          service: 'reports', 
          error: 'Service unavailable - rollback mock data used',
          rollback: true 
        });
      } else {
        console.log(`✅ Learning path sent to Reports: ${learningPathId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to send to Reports: ${error.message}`);
      results.errors.push({ service: 'reports', error: error.message });
      // Even if error, try to get rollback data
      try {
        const learningPathData = learningPath.learning_path || learningPath.pathMetadata || {};
        results.reports = this.reportsClient.getRollbackMockData(learningPathData);
        console.warn(`⚠️ Using rollback mock data for Reports`);
      } catch (rollbackError) {
        console.error(`❌ Failed to get rollback data: ${rollbackError.message}`);
      }
    }

    return results;
  }
}

