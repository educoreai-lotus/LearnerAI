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

    // Send to Course Builder
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
      const courseBuilderPayload = {
        user_id: learningPath.userId,
        user_name: skillsGap.user_name, // From skills_gap table
        company_id: skillsGap.company_id, // From skills_gap table
        company_name: skillsGap.company_name, // From skills_gap table
        competency_target_name: competencyTargetName,
        learning_path: learningPath.pathMetadata || learningPath.learning_path || learningPath.toJSON()
      };
      
      results.courseBuilder = await this.courseBuilderClient.sendLearningPath(courseBuilderPayload);
      console.log(`✅ Learning path sent to Course Builder: ${learningPathId}`);
    } catch (error) {
      console.error(`❌ Failed to send to Course Builder: ${error.message}`);
      results.errors.push({ service: 'courseBuilder', error: error.message });
    }

    // Send to Analytics (with gap_id, skills_raw_data, exam_status)
    try {
      // Fetch skills gap data to include gap_id, skills_raw_data, and exam_status
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
      
      // Build complete analytics payload with all required fields
      const analyticsPayload = {
        user_id: learningPath.userId,
        user_name: skillsGap.user_name, // From skills_gap table
        company_id: skillsGap.company_id, // From skills_gap table
        company_name: skillsGap.company_name, // From skills_gap table
        competency_target_name: competencyTargetName,
        gap_id: skillsGap.gap_id,
        skills_raw_data: skillsGap.skills_raw_data,
        exam_status: skillsGap.exam_status, // Use exam_status (matches database field)
        learning_path: learningPath.pathMetadata || learningPath.learning_path || learningPath.toJSON()
      };
      
      results.analytics = await this.analyticsClient.updatePathAnalytics(analyticsPayload);
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

