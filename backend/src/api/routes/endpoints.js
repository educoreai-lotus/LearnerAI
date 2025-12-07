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
   * POST /api/fill-learner-ai-fields
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
  router.post('/fill-learner-ai-fields', async (req, res) => {
    try {
      // Step 1: Get request body (express.json() should have already parsed it)
      let requestBody = req.body;
      
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
      let result;
      try {
        switch (requestBody.requester_service) {
          case "skills-engine":
            result = await skillsEngineHandler(requestBody.payload, dependencies);
            break;
          case "analytics":
            result = await analyticsHandler(requestBody.payload, dependencies);
            break;
          case "course-builder":
            result = await courseBuilderHandler(requestBody.payload, dependencies);
            break;
          case "ai":
          case "ai-service":
            result = await aiHandler(requestBody.payload, dependencies);
            break;
          default:
            return res.status(400).setHeader('Content-Type', 'application/json').send(JSON.stringify({
              error: "Unknown requester_service",
              message: `Unknown service: ${requestBody.requester_service}. Supported services: skills-engine, analytics, course-builder, ai`
            }));
        }
      } catch (handlerError) {
        console.error(`[FillFields] Error in ${requestBody.requester_service} handler:`, handlerError);
        return res.status(500).setHeader('Content-Type', 'application/json').send(JSON.stringify({
          error: "Handler execution failed",
          details: handlerError.message,
          requester_service: requestBody.requester_service
        }));
      }

      // Step 4: Store result in response.answer (as stringified JSON)
      requestBody.response.answer = typeof result === 'string' ? result : JSON.stringify(result);

      // Step 5: Return the full object as stringified JSON (preserving requester_service, payload, and response)
      return res.setHeader('Content-Type', 'application/json').send(JSON.stringify(requestBody));
    } catch (error) {
      console.error('[FillFields] Unexpected error:', error);
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

/**
 * Skills Engine Handler
 * Handles requests from the skills-engine service
 * Payload must contain an "action" field indicating the type of action
 * 
 * Action: "update_skills_gap" or "create_skills_gap"
 * - Requires: user_id, user_name, company_id, company_name, competency_target_name, status, gap
 * - Processes skills gap and stores in database
 * - Creates learner if doesn't exist
 */
async function skillsEngineHandler(payload, dependencies) {
  const { skillsGapRepository, learnerRepository, companyRepository } = dependencies;
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
    
    // Process the skills gap update
    const skillsGap = await processGapUpdateUseCase.execute({
      user_id,
      user_name,
      company_id,
      company_name,
      competency_target_name: competency_target_name || competency_name,
      competency_name,
      status: status || (exam_status === 'PASS' ? 'pass' : exam_status === 'FAIL' ? 'fail' : null),
      gap
    });
    
    return {
      success: true,
      action: action,
      data: {
        message: 'Skills gap processed successfully',
        skillsGap
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
  const { courseRepository, skillsGapRepository } = dependencies;
  const { action } = payload;
  
  // Use existing analytics data filling logic
  // Extract action from payload, then pass the rest to fillLearningAnalyticsData
  const { action: _, ...dataWithoutAction } = payload;
  const result = await fillLearningAnalyticsData(dataWithoutAction, { courseRepository, skillsGapRepository });
  
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
  
  // Unknown action
  throw new Error(`Unknown AI action: ${action}. Supported actions: query, chat`);
}
