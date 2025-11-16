import express from 'express';

const router = express.Router();

/**
 * Initialize routes with dependencies
 */
export function createEndpointsRouter(dependencies) {
  const {
    companyRepository,
    learnerRepository,
    courseRepository,
    skillsGapRepository,
    recommendationRepository
  } = dependencies;

  /**
   * POST /api/fill-learner-ai-fields
   * Fill fields endpoint - receives requests from other microservices
   * Protocol: serviceName + payload (stringified JSON)
   * 
   * Expected body:
   * {
   *   "serviceName": "Directory" | "SkillsEngine" | "LearningAnalytics" | "CourseBuilder" | "ManagementReporting",
   *   "payload": "<stringified JSON>"
   * }
   */
  router.post('/fill-learner-ai-fields', async (req, res) => {
    const { serviceName, payload } = req.body;

    // Step 1: Parse payload
    let data;
    try {
      data = JSON.parse(payload);
    } catch (err) {
      return res.status(400).json({ 
        error: "Invalid JSON",
        details: err.message 
      });
    }

    try {
      // Step 2: Handle by service
      let filledData;
      switch (serviceName) {
        case "Directory":
          filledData = await fillDirectoryData(data, { companyRepository, learnerRepository });
          break;
        case "SkillsEngine":
          filledData = await fillSkillsEngineData(data, { skillsGapRepository, courseRepository });
          break;
        case "LearningAnalytics":
          filledData = await fillLearningAnalyticsData(data, { courseRepository, skillsGapRepository });
          break;
        case "CourseBuilder":
          filledData = await fillCourseBuilderData(data, { courseRepository, skillsGapRepository });
          break;
        case "ManagementReporting":
          filledData = await fillManagementReportingData(data, { courseRepository, skillsGapRepository, companyRepository });
          break;
        default:
          return res.status(400).json({ 
            error: "Unknown serviceName",
            message: `Unknown service: ${serviceName}. Supported services: Directory, SkillsEngine, LearningAnalytics, CourseBuilder, ManagementReporting`
          });
      }

      // Step 3: Return stringified
      return res.json({
        serviceName,
        payload: JSON.stringify(filledData)
      });
    } catch (err) {
      console.error(`[Endpoints] Error filling data for ${serviceName}:`, err);
      return res.status(500).json({
        error: "Internal Fill Error",
        details: err.message,
        serviceName
      });
    }
  });

  return router;
}

/**
 * Fill Directory data
 * Directory might request: company info, learner info, decision maker info
 */
export async function fillDirectoryData(data, { companyRepository, learnerRepository }) {
  const filled = { ...data };

  // If company_id is provided, fill company details
  if (data.company_id && companyRepository && typeof companyRepository.getCompanyById === 'function') {
    try {
      const company = await companyRepository.getCompanyById(data.company_id);
      if (company) {
        filled.company_name = company.company_name || filled.company_name || '';
        filled.decision_maker_policy = company.decision_maker_policy || filled.decision_maker_policy || null;
        filled.decision_maker = company.decision_maker || filled.decision_maker || null;
      }
    } catch (error) {
      console.warn(`[Endpoints] Could not fetch company ${data.company_id}:`, error.message);
    }
  }

  // If user_id is provided, fill learner details
  if (data.user_id && learnerRepository && typeof learnerRepository.getLearnerById === 'function') {
    try {
      const learner = await learnerRepository.getLearnerById(data.user_id);
      if (learner) {
        filled.user_name = learner.user_name || filled.user_name || '';
        filled.company_id = learner.company_id || filled.company_id || '';
        filled.company_name = learner.company_name || filled.company_name || '';
      }
    } catch (error) {
      console.warn(`[Endpoints] Could not fetch learner ${data.user_id}:`, error.message);
    }
  }

  return filled;
}

/**
 * Fill Skills Engine data
 * Skills Engine might request: competency info, learning path info, skills gap info
 */
export async function fillSkillsEngineData(data, { skillsGapRepository, courseRepository }) {
  const filled = { ...data };

  // If competency_target_name is provided, fill learning path info
  if (data.competency_target_name && courseRepository && typeof courseRepository.getCourseById === 'function') {
    try {
      const course = await courseRepository.getCourseById(data.competency_target_name);
      if (course) {
        filled.learning_path = course.learning_path || filled.learning_path || null;
        filled.approved = course.approved !== undefined ? course.approved : filled.approved || false;
        filled.user_id = course.user_id || filled.user_id || '';
      }
    } catch (error) {
      console.warn(`[Endpoints] Could not fetch course for ${data.competency_target_name}:`, error.message);
    }
  }

  // If user_id and competency_target_name are provided, fill skills gap info
  if (data.user_id && data.competency_target_name && skillsGapRepository && typeof skillsGapRepository.getSkillsGapByUserAndCompetency === 'function') {
    try {
      const skillsGap = await skillsGapRepository.getSkillsGapByUserAndCompetency(
        data.user_id,
        data.competency_target_name
      );
      if (skillsGap) {
        filled.gap_id = skillsGap.gap_id || filled.gap_id || null;
        filled.skills_raw_data = skillsGap.skills_raw_data || filled.skills_raw_data || null;
        filled.exam_status = skillsGap.exam_status || filled.exam_status || null;
      }
    } catch (error) {
      console.warn(`[Endpoints] Could not fetch skills gap:`, error.message);
    }
  }

  return filled;
}

/**
 * Fill Learning Analytics data
 * Learning Analytics requests data for a specific user (on-demand mode)
 * 
 * Note: LearnerAI does NOT send learning_path unless Learning Analytics specifically requests it
 * by including competency_target_name in the request.
 * 
 * If only user_id is provided, return all courses for that user (without learning_path).
 * If user_id + competency_target_name is provided, return that specific course (with learning_path if requested).
 */
export async function fillLearningAnalyticsData(data, { courseRepository, skillsGapRepository }) {
  // If only user_id is provided, return all courses for that user (without learning_path)
  if (data.user_id && !data.competency_target_name) {
    try {
      if (courseRepository && typeof courseRepository.getCoursesByUser === 'function') {
        const courses = await courseRepository.getCoursesByUser(data.user_id);
        
        // Build response array with all courses for this user (without learning_path)
        const userData = [];
        for (const course of courses || []) {
          // Get skills gap for each course
          let skillsGap = null;
          if (skillsGapRepository && typeof skillsGapRepository.getSkillsGapByUserAndCompetency === 'function') {
            try {
              skillsGap = await skillsGapRepository.getSkillsGapByUserAndCompetency(
                data.user_id,
                course.competency_target_name
              );
            } catch (error) {
              console.warn(`[Endpoints] Could not fetch skills gap for ${course.competency_target_name}:`, error.message);
            }
          }
          
          userData.push({
            user_id: course.user_id,
            user_name: skillsGap?.user_name || '',
            company_id: skillsGap?.company_id || '',
            company_name: skillsGap?.company_name || '',
            competency_target_name: course.competency_target_name,
            gap_id: skillsGap?.gap_id || null,
            skills_raw_data: skillsGap?.skills_raw_data || null,
            exam_status: skillsGap?.exam_status || null
            // Note: learning_path is NOT included in on-demand mode
          });
        }
        
        return userData; // Return array of user data
      }
    } catch (error) {
      console.warn(`[Endpoints] Could not fetch courses for user ${data.user_id}:`, error.message);
      return [];
    }
  }

  // If user_id + competency_target_name is provided, return specific course data
  if (data.user_id && data.competency_target_name) {
    const filled = { ...data };

    try {
      // Get skills gap for analytics
      if (skillsGapRepository && typeof skillsGapRepository.getSkillsGapByUserAndCompetency === 'function') {
        const skillsGap = await skillsGapRepository.getSkillsGapByUserAndCompetency(
          data.user_id,
          data.competency_target_name
        );
        if (skillsGap) {
          filled.gap_id = skillsGap.gap_id || filled.gap_id || null;
          filled.skills_raw_data = skillsGap.skills_raw_data || filled.skills_raw_data || null;
          filled.exam_status = skillsGap.exam_status || filled.exam_status || null;
          filled.user_name = skillsGap.user_name || filled.user_name || '';
          filled.company_id = skillsGap.company_id || filled.company_id || '';
          filled.company_name = skillsGap.company_name || filled.company_name || '';
        }
      }

      // Only include learning_path if explicitly requested (competency_target_name provided)
      // Note: In on-demand mode, we typically don't send learning_path unless specifically requested
      if (data.include_learning_path !== false) {
        if (courseRepository && typeof courseRepository.getCourseById === 'function') {
          const course = await courseRepository.getCourseById(data.competency_target_name);
          if (course) {
            filled.learning_path = course.learning_path || filled.learning_path || null;
            filled.approved = course.approved !== undefined ? course.approved : filled.approved || false;
          }
        }
      }
    } catch (error) {
      console.warn(`[Endpoints] Could not fetch analytics data:`, error.message);
    }

    return filled;
  }

  // If neither user_id nor competency_target_name provided, return empty
  return [];
}

/**
 * Fill Course Builder data
 * Course Builder might request: learning path details, course structure, user info
 */
export async function fillCourseBuilderData(data, { courseRepository, skillsGapRepository }) {
  const filled = { ...data };

  // If competency_target_name is provided, fill learning path
  if (data.competency_target_name && courseRepository && typeof courseRepository.getCourseById === 'function') {
    try {
      const course = await courseRepository.getCourseById(data.competency_target_name);
      if (course) {
        filled.learning_path = course.learning_path || filled.learning_path || null;
        filled.user_id = course.user_id || filled.user_id || '';
        filled.approved = course.approved !== undefined ? course.approved : filled.approved || false;
      }
    } catch (error) {
      console.warn(`[Endpoints] Could not fetch course for Course Builder:`, error.message);
    }
  }

  // If user_id is provided, fill user name from skills gap
  if (data.user_id && data.competency_target_name && skillsGapRepository && typeof skillsGapRepository.getSkillsGapByUserAndCompetency === 'function') {
    try {
      const skillsGap = await skillsGapRepository.getSkillsGapByUserAndCompetency(
        data.user_id,
        data.competency_target_name
      );
      if (skillsGap) {
        filled.user_name = skillsGap.user_name || filled.user_name || '';
        filled.company_id = skillsGap.company_id || filled.company_id || '';
        filled.company_name = skillsGap.company_name || filled.company_name || '';
      }
    } catch (error) {
      console.warn(`[Endpoints] Could not fetch user info for Course Builder:`, error.message);
    }
  }

  return filled;
}

/**
 * Fill Management Reporting data
 * Management Reporting might request: company stats, learner progress, course completion data
 */
export async function fillManagementReportingData(data, { courseRepository, skillsGapRepository, companyRepository }) {
  const filled = { ...data };

  // If company_id is provided, fill company stats
  if (data.company_id && companyRepository && typeof companyRepository.getCompanyById === 'function') {
    try {
      const company = await companyRepository.getCompanyById(data.company_id);
      if (company) {
        filled.company_name = company.company_name || filled.company_name || '';
        filled.decision_maker_policy = company.decision_maker_policy || filled.decision_maker_policy || null;
      }
    } catch (error) {
      console.warn(`[Endpoints] Could not fetch company for reporting:`, error.message);
    }
  }

  // If user_id is provided, fill learner progress
  if (data.user_id && courseRepository && typeof courseRepository.getCoursesByUser === 'function') {
    try {
      const courses = await courseRepository.getCoursesByUser(data.user_id);
      filled.courses_count = courses ? courses.length : filled.courses_count || 0;
      filled.approved_courses_count = courses ? courses.filter(c => c.approved).length : filled.approved_courses_count || 0;
    } catch (error) {
      console.warn(`[Endpoints] Could not fetch courses for reporting:`, error.message);
    }
  }

  return filled;
}

