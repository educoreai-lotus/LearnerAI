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
    recommendationRepository,
    approvalRepository,
    geminiClient
  } = dependencies;

  /**
   * POST /api/fill-content-metrics
   * Fill fields endpoint - receives stringified JSON body with requester_service, payload (with action), and response
   * 
   * Expected body (as stringified JSON):
   * "{\"requester_service\":\"content-studio\",\"payload\":{\"action\":\"generate-questions\",...},\"response\":{\"answer\":\"\"}}"
   * 
   * Structure:
   * - requester_service: service name (skills-engine, analytics, course-builder, ai)
   * - payload: object with "action" field indicating the action type, plus other data
   * - response: object with "answer" field that will be populated with the result
   * 
   * After processing, returns the full object with response.answer populated, as stringified JSON
   */
  router.post('/fill-content-metrics', async (req, res) => {
    const requestStartTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Log incoming request from Coordinator
      console.log(`\n${'='.repeat(80)}`);
      console.log(`[Coordinator Request] ${requestId} - ${new Date().toISOString()}`);
      console.log(`[Coordinator Request] ${requestId} - IP: ${req.ip || req.connection.remoteAddress || 'unknown'}`);
      console.log(`[Coordinator Request] ${requestId} - Method: ${req.method} ${req.path}`);
      console.log(`[Coordinator Request] ${requestId} - Headers:`, {
        'content-type': req.headers['content-type'],
        'x-service-name': req.headers['x-service-name'],
        'x-signature': req.headers['x-signature'] ? 'present' : 'missing',
        'user-agent': req.headers['user-agent'],
        'authorization': req.headers['authorization'] ? 'present' : 'missing'
      });
      
      // Step 1: Get request body (express.json() should have already parsed it)
      let requestBody = req.body;
      
      // Log request body (sanitized - don't log sensitive data)
      if (requestBody) {
        const sanitizedBody = {
          requester_service: requestBody.requester_service,
          payload: {
            action: requestBody.payload?.action,
            type: requestBody.payload?.type,
            date_range: requestBody.payload?.date_range,
            // Log other payload keys but not full values for large objects
            payload_keys: requestBody.payload ? Object.keys(requestBody.payload) : []
          },
          has_response: !!requestBody.response
        };
        console.log(`[Coordinator Request] ${requestId} - Request Body:`, JSON.stringify(sanitizedBody, null, 2));
      }
      
      // If body is undefined or null, return error
      if (!requestBody) {
        return res.status(400).setHeader('Content-Type', 'application/json').send(JSON.stringify({
          error: "Missing request body",
          details: "Request body is required. Ensure Content-Type header is set to 'application/json' and send a valid JSON body."
        }));
      }
      
      // If body is a string (shouldn't happen with express.json(), but handle it)
      if (typeof requestBody === 'string') {
        try {
          requestBody = JSON.parse(requestBody);
        } catch (parseError) {
          return res.status(400).setHeader('Content-Type', 'application/json').send(JSON.stringify({
            error: "Failed to parse request body as JSON",
            details: parseError.message
          }));
        }
      }
      
      // Ensure requestBody is an object
      if (typeof requestBody !== 'object' || requestBody === null || Array.isArray(requestBody)) {
        return res.status(400).setHeader('Content-Type', 'application/json').send(JSON.stringify({
          error: "Invalid request body format",
          details: "Request body must be a JSON object, not an array or primitive value."
        }));
      }

      // Step 2: Validate required fields
      if (!requestBody.requester_service) {
        return res.status(400).setHeader('Content-Type', 'application/json').send(JSON.stringify({
          error: "Missing required field: requester_service"
        }));
      }
      if (!requestBody.payload) {
        return res.status(400).setHeader('Content-Type', 'application/json').send(JSON.stringify({
          error: "Missing required field: payload"
        }));
      }
      if (!requestBody.payload.action) {
        return res.status(400).setHeader('Content-Type', 'application/json').send(JSON.stringify({
          error: "Missing required field: payload.action",
          message: "Every payload must contain an 'action' field indicating the type of action"
        }));
      }
      if (!requestBody.response) {
        requestBody.response = { answer: "" };
      }
      if (requestBody.response.answer === undefined) {
        requestBody.response.answer = "";
      }

      // Step 3: Route based on requester_service
      console.log(`[Coordinator Request] ${requestId} - Routing to handler: ${requestBody.requester_service}`);
      console.log(`[Coordinator Request] ${requestId} - Action: ${requestBody.payload?.action || 'none'}`);
      
      let result;
      try {
        switch (requestBody.requester_service) {
          case "skills-engine":
            result = await skillsEngineHandler(requestBody.payload, dependencies);
            break;
          case "LearningAnalytics":
            result = await analyticsHandler(requestBody.payload, dependencies);
            break;
          case "course-builder":
            result = await courseBuilderHandler(requestBody.payload, dependencies);
            break;
          case "ai":
          case "ai-service":
            result = await aiHandler(requestBody.payload, dependencies);
            break;
          case "directory":
          case "Directory":
            // Directory requests company/learner data
            const { action: _, ...dataWithoutAction } = requestBody.payload;
            result = {
              success: true,
              action: requestBody.payload.action || 'fill_directory_data',
              data: await fillDirectoryData(dataWithoutAction, { 
                companyRepository, 
                learnerRepository 
              })
            };
            break;
          case "rag":
          case "rag-microservice":
          case "rag-service":
            // RAG microservice might request course recommendations, learning paths, or user data
            const { action: ragAction, ...ragDataWithoutAction } = requestBody.payload;
            
            // If RAG requests recommendations, fetch them
            if (ragAction === 'get_recommendations' && ragDataWithoutAction.user_id && recommendationRepository) {
              try {
                const recommendations = await recommendationRepository.getRecommendationsByUser(ragDataWithoutAction.user_id);
                result = {
                  success: true,
                  action: ragAction,
                  data: {
                    recommendations: recommendations || [],
                    user_id: ragDataWithoutAction.user_id
                  }
                };
              } catch (error) {
                console.warn(`[Endpoints] Could not fetch recommendations for RAG:`, error.message);
                result = {
                  success: true,
                  action: ragAction,
                  data: {
                    recommendations: [],
                    user_id: ragDataWithoutAction.user_id
                  }
                };
              }
            } else {
              // Default: return the data as-is (RAG can request other data in the future)
              result = {
                success: true,
                action: ragAction || 'fill_rag_data',
                data: ragDataWithoutAction
              };
            }
            break;
          default:
            console.warn(`[Coordinator Request] ${requestId} - Unknown service: ${requestBody.requester_service}`);
            return res.status(400).setHeader('Content-Type', 'application/json').send(JSON.stringify({
              error: "Unknown requester_service",
              message: `Unknown service: ${requestBody.requester_service}. Supported services: skills-engine, analytics, LearningAnalytics, course-builder, ai, directory, Directory, rag, rag-microservice, rag-service`
            }));
        }
        
        const processingTime = Date.now() - requestStartTime;
        console.log(`[Coordinator Request] ${requestId} - Handler completed successfully in ${processingTime}ms`);
        
        // Log result summary (not full result for large responses)
        if (result) {
          const resultSummary = {
            success: result.success,
            action: result.action,
            data_type: typeof result.data,
            data_keys: result.data && typeof result.data === 'object' ? Object.keys(result.data) : null,
            data_length: Array.isArray(result.data) ? result.data.length : 
                         (result.data && typeof result.data === 'object' ? Object.keys(result.data).length : null)
          };
          console.log(`[Coordinator Request] ${requestId} - Result Summary:`, JSON.stringify(resultSummary, null, 2));
        }
      } catch (handlerError) {
        const processingTime = Date.now() - requestStartTime;
        console.error(`[Coordinator Request] ${requestId} - Handler Error after ${processingTime}ms:`, {
          service: requestBody.requester_service,
          action: requestBody.payload?.action,
          error: handlerError.message,
          stack: handlerError.stack
        });
        return res.status(500).setHeader('Content-Type', 'application/json').send(JSON.stringify({
          error: "Handler execution failed",
          details: handlerError.message,
          requester_service: requestBody.requester_service
        }));
      }

      // Step 4: Store result in response.answer (as stringified JSON)
      requestBody.response.answer = typeof result === 'string' ? result : JSON.stringify(result);

      // Step 5: Return the full object as stringified JSON (preserving requester_service, payload, and response)
      const totalTime = Date.now() - requestStartTime;
      const responseSize = JSON.stringify(requestBody).length;
      console.log(`[Coordinator Request] ${requestId} - Response: ${res.statusCode} | Size: ${responseSize} bytes | Total time: ${totalTime}ms`);
      console.log(`${'='.repeat(80)}\n`);
      
      return res.setHeader('Content-Type', 'application/json').send(JSON.stringify(requestBody));
    } catch (error) {
      const totalTime = Date.now() - requestStartTime;
      console.error(`[Coordinator Request] ${requestId} - Unexpected error after ${totalTime}ms:`, {
        error: error.message,
        stack: error.stack
      });
      console.log(`${'='.repeat(80)}\n`);
      return res.status(500).setHeader('Content-Type', 'application/json').send(JSON.stringify({
        error: "Internal server error",
        details: error.message
      }));
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
 * Learning Analytics requests data for a specific user (on-demand mode) or batch ingestion
 * 
 * Note: LearnerAI does NOT send learning_path unless Learning Analytics specifically requests it
 * by including competency_target_name in the request.
 * 
 * Modes:
 * 1. Batch ingestion: If type="batch" or date_range is provided, return all courses within date range
 * 2. If only user_id is provided, return all courses for that user (without learning_path).
 * 3. If user_id + competency_target_name is provided, return that specific course (with learning_path if requested).
 */
export async function fillLearningAnalyticsData(data, { courseRepository, skillsGapRepository, learnerRepository }) {
  // Handle batch ingestion requests
  if (data.type === 'batch' || data.date_range) {
    try {
      const startDate = data.date_range?.start_date || null;
      const endDate = data.date_range?.end_date || null;
      
      console.log('[FillLearningAnalyticsData] Batch request received:', {
        type: data.type,
        date_range: data.date_range,
        startDate,
        endDate
      });
      
      // Get all courses (we'll filter by date if provided)
      let courses = [];
      if (courseRepository && typeof courseRepository.getAllCourses === 'function') {
        courses = await courseRepository.getAllCourses();
        console.log(`[FillLearningAnalyticsData] Found ${courses.length} total courses`);
        
        // Filter by date range if provided
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          // Set end date to end of day (23:59:59)
          end.setHours(23, 59, 59, 999);
          
          const beforeFilter = courses.length;
          courses = courses.filter(course => {
            if (!course.created_at) return false;
            const courseDate = new Date(course.created_at);
            const isInRange = courseDate >= start && courseDate <= end;
            if (!isInRange) {
              console.log(`[FillLearningAnalyticsData] Course ${course.competency_target_name} excluded: ${courseDate.toISOString()} not in range ${start.toISOString()} - ${end.toISOString()}`);
            }
            return isInRange;
          });
          console.log(`[FillLearningAnalyticsData] After date filter: ${courses.length} courses (filtered from ${beforeFilter})`);
        } else {
          console.log('[FillLearningAnalyticsData] No date range provided, returning all courses');
        }
      }
      
      // Build response array with all courses and their skills gap data
      const learningPaths = [];
      for (const course of courses || []) {
        console.log(`[FillLearningAnalyticsData] Processing course: ${course.competency_target_name} for user: ${course.user_id}`);
        
        // Get skills gap for each course (contains user_name, company_name, company_id, skills_raw_data, exam_status)
        let skillsGap = null;
        if (skillsGapRepository && typeof skillsGapRepository.getSkillsGapByUserAndCompetency === 'function') {
          try {
            skillsGap = await skillsGapRepository.getSkillsGapByUserAndCompetency(
              course.user_id,
              course.competency_target_name
            );
            console.log(`[FillLearningAnalyticsData] Found skills gap for ${course.competency_target_name}:`, skillsGap ? 'yes' : 'no');
          } catch (error) {
            console.warn(`[Endpoints] Could not fetch skills gap for ${course.competency_target_name}:`, error.message);
          }
        }
        
        // Fallback: Get learner data if skills gap doesn't have user/company info
        let learner = null;
        if ((!skillsGap || !skillsGap.user_name || !skillsGap.company_name) && learnerRepository && typeof learnerRepository.getLearnerById === 'function') {
          try {
            learner = await learnerRepository.getLearnerById(course.user_id);
            console.log(`[FillLearningAnalyticsData] Found learner for ${course.user_id}:`, learner ? 'yes' : 'no');
          } catch (error) {
            console.warn(`[Endpoints] Could not fetch learner for ${course.user_id}:`, error.message);
          }
        }
        
        // Map learning path structure (steps-based format)
        let learningPathSteps = [];
        if (course.learning_path) {
          if (course.learning_path.steps && Array.isArray(course.learning_path.steps)) {
            learningPathSteps = course.learning_path.steps;
          } else if (course.learning_path.modules && Array.isArray(course.learning_path.modules)) {
            // Convert modules format to steps format
            let stepIndex = 0;
            course.learning_path.modules.forEach(module => {
              if (module.lessons && Array.isArray(module.lessons)) {
                module.lessons.forEach(lesson => {
                  learningPathSteps.push({
                    step: stepIndex++,
                    title: lesson.lesson_name || '',
                    duration: lesson.duration_minutes ? `${lesson.duration_minutes} minutes` : '',
                    resources: [],
                    objectives: module.objectives || [],
                    estimatedTime: lesson.duration_minutes ? `${lesson.duration_minutes} minutes` : ''
                  });
                });
              }
            });
          }
        }
        
        // Calculate estimated completion from learning path
        let estimatedCompletion = '';
        if (course.learning_path?.estimated_duration_hours) {
          estimatedCompletion = `${course.learning_path.estimated_duration_hours} hours`;
        } else if (course.learning_path?.estimatedCompletion) {
          estimatedCompletion = course.learning_path.estimatedCompletion;
        } else if (learningPathSteps.length > 0) {
          // Calculate from steps if available
          const totalMinutes = learningPathSteps.reduce((sum, step) => {
            const duration = step.duration || step.estimatedTime || '';
            const minutes = parseInt(duration) || 0;
            return sum + minutes;
          }, 0);
          if (totalMinutes > 0) {
            estimatedCompletion = `${Math.round(totalMinutes / 60 * 10) / 10} hours`;
          }
        }
        
        // Collect data with fallback priority: skillsGap > learner > empty
        const user_name = skillsGap?.user_name || learner?.user_name || '';
        const company_id = skillsGap?.company_id || learner?.company_id || '';
        const company_name = skillsGap?.company_name || learner?.company_name || '';
        const gap_id = skillsGap?.gap_id || course.gap_id || '';
        const skills_raw_data = skillsGap?.skills_raw_data || {};
        const exam_status = skillsGap?.exam_status || '';
        
        learningPaths.push({
          user_id: course.user_id || '',
          user_name: user_name,
          company_id: company_id,
          company_name: company_name,
          competency_target_name: course.competency_target_name || '',
          gap_id: gap_id,
          skills_raw_data: skills_raw_data,
          exam_status: exam_status,
          learning_path: {
            steps: learningPathSteps,
            estimatedCompletion: estimatedCompletion,
            totalSteps: learningPathSteps.length,
            createdAt: course.created_at || '',
            updatedAt: course.last_modified_at || ''
          }
        });
      }
      
      console.log(`[FillLearningAnalyticsData] Returning ${learningPaths.length} learning paths`);
      return learningPaths;
    } catch (error) {
      console.warn(`[Endpoints] Could not fetch batch analytics data:`, error.message);
      return [];
    }
  }
  
  // If only user_id is provided, return all courses for that user (without learning_path)
  if (data.user_id && !data.competency_target_name) {
    try {
      if (courseRepository && typeof courseRepository.getCoursesByUser === 'function') {
        const courses = await courseRepository.getCoursesByUser(data.user_id);
        
        // Get learner data as fallback for user/company info
        let learner = null;
        if (learnerRepository && typeof learnerRepository.getLearnerById === 'function') {
          try {
            learner = await learnerRepository.getLearnerById(data.user_id);
          } catch (error) {
            console.warn(`[Endpoints] Could not fetch learner for ${data.user_id}:`, error.message);
          }
        }
        
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
          
          // Use fallback: skillsGap > learner > empty
          userData.push({
            user_id: course.user_id,
            user_name: skillsGap?.user_name || learner?.user_name || '',
            company_id: skillsGap?.company_id || learner?.company_id || '',
            company_name: skillsGap?.company_name || learner?.company_name || '',
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
      let skillsGap = null;
      if (skillsGapRepository && typeof skillsGapRepository.getSkillsGapByUserAndCompetency === 'function') {
        skillsGap = await skillsGapRepository.getSkillsGapByUserAndCompetency(
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
      
      // Fallback: Get learner data if skills gap doesn't have user/company info
      if ((!skillsGap || !skillsGap.user_name || !skillsGap.company_name) && learnerRepository && typeof learnerRepository.getLearnerById === 'function') {
        try {
          const learner = await learnerRepository.getLearnerById(data.user_id);
          if (learner) {
            filled.user_name = filled.user_name || learner.user_name || '';
            filled.company_id = filled.company_id || learner.company_id || '';
            filled.company_name = filled.company_name || learner.company_name || '';
          }
        } catch (error) {
          console.warn(`[Endpoints] Could not fetch learner for ${data.user_id}:`, error.message);
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

/**
 * Skills Engine Handler
 * Handles requests from the skills-engine service
 * Payload must contain an "action" field indicating the type of action
 * 
 * Action: "update_skills_gap" or "create_skills_gap"
 * - Requires: user_id, user_name, company_id, company_name, competency_target_name, status, gap
 * - Processes skills gap and stores in database
 * - Creates learner if doesn't exist
 * - Automatically triggers learning path generation after processing
 */
async function skillsEngineHandler(payload, dependencies) {
  const { 
    skillsGapRepository, 
    learnerRepository, 
    companyRepository,
    geminiClient,
    skillsEngineClient,
    repository,
    jobRepository,
    promptLoader,
    cacheRepository,
    skillsExpansionRepository,
    checkApprovalPolicyUseCase,
    requestPathApprovalUseCase,
    distributePathUseCase
  } = dependencies;
  const { action } = payload;
  
  // Handle skills gap updates from Skills Engine
  if (action === 'update_skills_gap' || action === 'create_skills_gap') {
    const { ProcessSkillsGapUpdateUseCase } = await import('../../application/useCases/ProcessSkillsGapUpdateUseCase.js');
    const processGapUpdateUseCase = new ProcessSkillsGapUpdateUseCase({
      skillsGapRepository,
      learnerRepository,
      companyRepository
    });
    
    // Extract skills gap data from payload
    const {
      user_id,
      user_name,
      company_id,
      company_name,
      competency_target_name,
      competency_name,
      exam_status,
      status,
      gap
    } = payload;
    
    const finalStatus = status || (exam_status === 'PASS' ? 'pass' : exam_status === 'FAIL' ? 'fail' : null);
    const competencyTargetName = competency_target_name || competency_name;
    
    // Process the skills gap update
    const skillsGap = await processGapUpdateUseCase.execute({
      user_id,
      user_name,
      company_id,
      company_name,
      competency_target_name: competencyTargetName,
      competency_name,
      status: finalStatus,
      gap
    });
    
    // Automatically trigger learning path generation after skills gap is processed
    let jobId = null;
    try {
      if (geminiClient && repository && jobRepository && promptLoader) {
        const { GenerateLearningPathUseCase } = await import('../../application/useCases/GenerateLearningPathUseCase.js');
        const { SkillsGap } = await import('../../domain/entities/SkillsGap.js');
        
        const generatePathUseCase = new GenerateLearningPathUseCase({
          geminiClient,
          skillsEngineClient,
          repository,
          jobRepository,
          promptLoader,
          cacheRepository,
          skillsGapRepository,
          skillsExpansionRepository,
          checkApprovalPolicyUseCase,
          requestPathApprovalUseCase,
          distributePathUseCase
        });
        
        // Create SkillsGap entity for learning path generation
        const skillsGapEntity = new SkillsGap({
          userId: user_id,
          companyId: company_id,
          competencyTargetName: competencyTargetName
        });
        
        // Trigger learning path generation (async - fire and forget)
        const result = await generatePathUseCase.execute(skillsGapEntity);
        jobId = result.jobId;
        
        console.log(`✅ Learning path generation triggered for user ${user_id}, competency ${competencyTargetName}, jobId: ${jobId}`);
      } else {
        console.warn('⚠️  Cannot trigger learning path generation: missing dependencies');
      }
    } catch (error) {
      // Log error but don't fail the skills gap update
      console.error(`❌ Failed to trigger learning path generation: ${error.message}`, error);
    }
    
    return {
      success: true,
      action: action,
      data: {
        message: 'Skills gap processed successfully',
        skillsGap,
        ...(jobId && { jobId, learningPathGenerationStarted: true })
      }
    };
  }
  
  // Unknown action
  throw new Error(`Unknown Skills Engine action: ${action}. Supported actions: update_skills_gap, create_skills_gap`);
}

/**
 * Analytics Handler
 * Handles requests from the analytics service
 * Payload must contain an "action" field indicating the type of action
 * Maps to existing fillLearningAnalyticsData functionality
 */
async function analyticsHandler(payload, dependencies) {
  const { courseRepository, skillsGapRepository, learnerRepository } = dependencies;
  const { action } = payload;
  
  // Use existing analytics data filling logic
  // Extract action from payload, then pass the rest to fillLearningAnalyticsData
  const { action: _, ...dataWithoutAction } = payload;
  const result = await fillLearningAnalyticsData(dataWithoutAction, { courseRepository, skillsGapRepository, learnerRepository });
  
  // For batch requests, format response according to LearningAnalytics expectations
  if (payload.type === 'batch' || payload.date_range) {
    const formattedResult = {
      version: "1.0.0",
      fetched_at: new Date().toISOString(),
      pagination: {
        total_learning_paths: Array.isArray(result) ? result.length : 0,
        returned_learning_paths: Array.isArray(result) ? result.length : 0,
        next_cursor: "",
        has_more: false
      },
      learning_paths: Array.isArray(result) ? result : []
    };
    
    console.log('[AnalyticsHandler] Batch response formatted:', {
      total_learning_paths: formattedResult.pagination.total_learning_paths,
      learning_paths_count: formattedResult.learning_paths.length
    });
    
    return {
      success: true,
      action: action,
      data: formattedResult
    };
  }
  
  return {
    success: true,
    action: action,
    data: result
  };
}

/**
 * Course Builder Handler
 * Handles requests from the course-builder service
 * Payload must contain an "action" field indicating the type of action
 * 
 * Action: "request_learning_path"
 * - Requires: userId, competencyTargetName
 * - Returns learning path data if approved
 * - Waits for approval if not approved yet (async)
 */
async function courseBuilderHandler(payload, dependencies) {
  const { 
    courseRepository, 
    skillsGapRepository, 
    approvalRepository,
    learnerRepository 
  } = dependencies;
  const { action } = payload;
  
  // Handle AI queries (allow course-builder to make AI requests)
  if (action === 'query' || action === 'chat') {
    return await aiHandler(payload, dependencies);
  }
  
  // Handle learning path request
  if (action === 'request_learning_path') {
    const { userId, competencyTargetName } = payload;
    
    if (!userId || !competencyTargetName) {
      throw new Error('userId and competencyTargetName are required for request_learning_path action');
    }

    // Import and use the new use case
    const { GetLearningPathForCourseBuilderUseCase } = await import('../../application/useCases/GetLearningPathForCourseBuilderUseCase.js');
    const getLearningPathUseCase = new GetLearningPathForCourseBuilderUseCase({
      courseRepository,
      approvalRepository,
      skillsGapRepository,
      learnerRepository
    });

    // Get learning path data (will wait for approval if needed)
    const result = await getLearningPathUseCase.execute(userId, competencyTargetName, {
      maxWaitTime: payload.maxWaitTime || 30000, // 30 seconds default
      pollInterval: payload.pollInterval || 1000  // 1 second default
    });

    if (!result.approved) {
      // Path not approved yet - return pending status
      return {
        success: false,
        action: action,
        status: 'pending_approval',
        message: result.message,
        data: null
      };
    }

    // Path is approved - return data
    return {
      success: true,
      action: action,
      status: 'approved',
      message: result.message,
      data: result.data
    };
  }
  
  // Fallback to existing course builder data filling logic for other actions
  const { action: _, ...dataWithoutAction } = payload;
  const result = await fillCourseBuilderData(dataWithoutAction, { courseRepository, skillsGapRepository });
  
  return {
    success: true,
    action: action,
    data: result
  };
}

/**
 * AI Handler
 * Handles AI query requests from other microservices
 * Payload must contain an "action" field indicating the type of action
 * 
 * Actions:
 * - "query": Single AI prompt query
 * - "chat": Conversation with context
 * - "map_fields": Map field names from microservices to LearnerAI format
 * - "map_fields_ai": AI-powered intelligent field mapping
 */
async function aiHandler(payload, dependencies) {
  const { geminiClient } = dependencies;
  const { action } = payload;
  
  if (!geminiClient) {
    throw new Error('AI service (Gemini) is not available. Please configure GEMINI_API_KEY.');
  }
  
  // Handle AI query action
  if (action === 'query') {
    const { prompt, model, temperature, maxTokens, format = 'text' } = payload;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('prompt is required and must be a non-empty string');
    }
    
    // Validate optional parameters
    if (temperature !== undefined && (typeof temperature !== 'number' || temperature < 0 || temperature > 1)) {
      throw new Error('temperature must be a number between 0.0 and 1.0');
    }
    
    if (maxTokens !== undefined && (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 8192)) {
      throw new Error('maxTokens must be a number between 1 and 8192');
    }
    
    if (format && !['json', 'text'].includes(format)) {
      throw new Error('format must be either "json" or "text"');
    }
    
    // Prepare options
    const options = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 60000 // 60 seconds for AI queries
    };
    
    // Execute the prompt
    const startTime = Date.now();
    const response = await geminiClient.executePrompt(prompt, '', options);
    const duration = Date.now() - startTime;
    
    // Format response based on format parameter
    let formattedResponse = response;
    if (format === 'json') {
      if (typeof response === 'string') {
        try {
          formattedResponse = JSON.parse(response);
        } catch (e) {
          formattedResponse = {
            _note: 'Response is not valid JSON, returning as text',
            text: response
          };
        }
      }
    }
    
    return {
      success: true,
      action: action,
      response: formattedResponse,
      model: model || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
  }
  
  // Handle AI chat action (conversation with context)
  if (action === 'chat') {
    const { messages, model, temperature } = payload;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('messages is required and must be a non-empty array');
    }
    
    // Validate message structure
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        throw new Error('Each message must have "role" and "content" fields');
      }
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        throw new Error('role must be "user", "assistant", or "system"');
      }
    }
    
    // Build conversation prompt from messages
    let conversationPrompt = '';
    for (const msg of messages) {
      if (msg.role === 'system') {
        conversationPrompt += `System: ${msg.content}\n\n`;
      } else if (msg.role === 'user') {
        conversationPrompt += `User: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        conversationPrompt += `Assistant: ${msg.content}\n\n`;
      }
    }
    conversationPrompt += 'Assistant:';
    
    // Execute the chat prompt
    const options = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 60000
    };
    
    const startTime = Date.now();
    const response = await geminiClient.executePrompt(conversationPrompt, '', options);
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      action: action,
      response: typeof response === 'string' ? response : JSON.stringify(response),
      model: model || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
  }
  
  // Handle field mapping action (now uses AI by default if available)
  if (action === 'map_fields') {
    const { mapFields, mapFieldsAuto, mapFieldsWithAI, getFieldMappings } = await import('../../utils/fieldMapper.js');
    const { data, service_name, custom_mappings, target_schema, use_ai = true } = payload;
    
    if (!data || typeof data !== 'object') {
      throw new Error('data is required and must be an object');
    }
    
    // Use AI-powered mapping by default if geminiClient is available and use_ai is true
    if (use_ai && geminiClient) {
      try {
        const result = await mapFieldsWithAI(data, geminiClient, service_name || null, custom_mappings || {}, target_schema || null);
        
        return {
          success: true,
          action: action,
          original_data: data,
          mapped_data: result.mapped_data,
          ai_mappings: result.ai_mappings,
          predefined_mappings: result.predefined_mappings,
          detected_service: result.detected_service,
          unmapped_fields: result.unmapped_fields,
          ai_reasoning: result.ai_reasoning,
          ai_confidence_scores: result.ai_confidence_scores,
          custom_mappings: custom_mappings || {},
          mapping_method: 'ai_powered'
        };
      } catch (aiError) {
        console.warn('AI mapping failed, falling back to predefined mappings:', aiError.message);
        // Fall through to predefined mapping
      }
    }
    
    // Fallback to predefined mappings (fast path, no AI)
    if (service_name) {
      const mapped = mapFields(data, service_name, custom_mappings || {});
      const mappings = getFieldMappings(service_name);
      
      return {
        success: true,
        action: action,
        original_data: data,
        mapped_data: mapped,
        service_name: service_name,
        mappings_used: mappings,
        custom_mappings: custom_mappings || {},
        mapping_method: 'predefined'
      };
    } else {
      // Auto-detect service and map
      const result = mapFieldsAuto(data, custom_mappings || {});
      
      return {
        success: true,
        action: action,
        original_data: data,
        ...result,
        custom_mappings: custom_mappings || {},
        mapping_method: 'predefined_auto'
      };
    }
  }
  
  // Handle AI-powered intelligent field mapping
  if (action === 'map_fields_ai') {
    const { mapFieldsAuto, getFieldMappings } = await import('../../utils/fieldMapper.js');
    const { data, target_schema, service_name, custom_mappings } = payload;
    
    if (!data || typeof data !== 'object') {
      throw new Error('data is required and must be an object');
    }
    
    if (!geminiClient) {
      throw new Error('AI service (Gemini) is not available. Please configure GEMINI_API_KEY.');
    }
    
    // First, try automatic mapping
    const autoResult = mapFieldsAuto(data, custom_mappings || {});
    
    // Build AI prompt for intelligent mapping
    const sourceFields = Object.keys(data);
    const targetFields = target_schema ? Object.keys(target_schema) : 
      ['user_id', 'user_name', 'company_id', 'company_name', 'competency_target_name', 'status', 'gap'];
    
    const mappingPrompt = `You are a field mapping assistant. Your task is to intelligently map field names from a source object to target field names.

Source fields: ${JSON.stringify(sourceFields, null, 2)}
Target fields: ${JSON.stringify(targetFields, null, 2)}
Source data sample: ${JSON.stringify(data, null, 2).substring(0, 500)}

${target_schema ? `Target schema: ${JSON.stringify(target_schema, null, 2)}` : ''}

Analyze the source fields and map them to the most appropriate target fields based on:
1. Semantic similarity (e.g., "learner_id" → "user_id", "organization_name" → "company_name")
2. Common naming patterns
3. Data type compatibility
4. Context clues from the data values

Return a JSON object with:
{
  "mappings": {
    "source_field_name": "target_field_name",
    ...
  },
  "confidence": {
    "source_field_name": 0.0-1.0,
    ...
  },
  "unmapped_fields": ["field1", "field2"],
  "reasoning": "Brief explanation of key mappings"
}

Only include mappings you're confident about (confidence > 0.6).`;

    try {
      const options = {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000
      };
      
      const aiResponse = await geminiClient.executePrompt(mappingPrompt, '', options);
      
      // Parse AI response
      let aiMappings = {};
      let confidence = {};
      let reasoning = '';
      
      if (typeof aiResponse === 'string') {
        try {
          const parsed = JSON.parse(aiResponse);
          aiMappings = parsed.mappings || {};
          confidence = parsed.confidence || {};
          reasoning = parsed.reasoning || '';
        } catch (e) {
          // If parsing fails, try to extract JSON from text
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiMappings = parsed.mappings || {};
            confidence = parsed.confidence || {};
            reasoning = parsed.reasoning || '';
          }
        }
      } else if (typeof aiResponse === 'object') {
        aiMappings = aiResponse.mappings || {};
        confidence = aiResponse.confidence || {};
        reasoning = aiResponse.reasoning || '';
      }
      
      // Apply AI mappings
      const finalMappings = { ...autoResult.mapped_data };
      for (const [sourceField, targetField] of Object.entries(aiMappings)) {
        if (data[sourceField] !== undefined && confidence[sourceField] > 0.6) {
          finalMappings[targetField] = data[sourceField];
          if (sourceField !== targetField) {
            delete finalMappings[sourceField];
          }
        }
      }
      
      return {
        success: true,
        action: action,
        original_data: data,
        mapped_data: finalMappings,
        auto_mapping: autoResult,
        ai_mappings: aiMappings,
        ai_confidence: confidence,
        ai_reasoning: reasoning,
        service_name: service_name || autoResult.detected_service,
        custom_mappings: custom_mappings || {}
      };
    } catch (error) {
      // Fallback to automatic mapping if AI fails
      console.warn('AI field mapping failed, using automatic mapping:', error.message);
      return {
        success: true,
        action: action,
        original_data: data,
        ...autoResult,
        ai_error: error.message,
        fallback: 'automatic_mapping'
      };
    }
  }
  
  // Unknown action
  throw new Error(`Unknown AI action: ${action}. Supported actions: query, chat, map_fields, map_fields_ai`);
}
