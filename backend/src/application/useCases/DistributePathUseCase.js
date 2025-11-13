/**
 * DistributePathUseCase
 * Distributes learning path to Course Builder, Analytics, and Reports after approval
 */
export class DistributePathUseCase {
  constructor({ courseBuilderClient, analyticsClient, reportsClient, repository }) {
    this.courseBuilderClient = courseBuilderClient;
    this.analyticsClient = analyticsClient;
    this.reportsClient = reportsClient;
    this.repository = repository;
  }

  /**
   * Distribute learning path to all microservices
   * @param {string} learningPathId
   * @returns {Promise<Object>} Distribution results
   */
  async execute(learningPathId) {
    // Get learning path from repository
    const learningPath = await this.repository.getLearningPathById(learningPathId);
    if (!learningPath) {
      throw new Error(`Learning path ${learningPathId} not found`);
    }

    const results = {
      courseBuilder: null,
      analytics: null,
      reports: null,
      errors: []
    };

    // Send to Course Builder
    try {
      results.courseBuilder = await this.courseBuilderClient.sendLearningPath(learningPath.toJSON());
      console.log(`✅ Learning path sent to Course Builder: ${learningPathId}`);
    } catch (error) {
      console.error(`❌ Failed to send to Course Builder: ${error.message}`);
      results.errors.push({ service: 'courseBuilder', error: error.message });
    }

    // Send to Analytics
    try {
      results.analytics = await this.analyticsClient.updatePathAnalytics(learningPath.toJSON());
      console.log(`✅ Learning path sent to Analytics: ${learningPathId}`);
    } catch (error) {
      console.error(`❌ Failed to send to Analytics: ${error.message}`);
      results.errors.push({ service: 'analytics', error: error.message });
    }

    // Send to Reports
    try {
      results.reports = await this.reportsClient.updatePathReports(learningPath.toJSON());
      console.log(`✅ Learning path sent to Reports: ${learningPathId}`);
    } catch (error) {
      console.error(`❌ Failed to send to Reports: ${error.message}`);
      results.errors.push({ service: 'reports', error: error.message });
    }

    return results;
  }
}

