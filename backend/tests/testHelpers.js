import { jest } from '@jest/globals';

/**
 * Test helper utilities for feature tests
 */

/**
 * Test an Express route handler
 * @param {Object} router - Express router
 * @param {string} method - HTTP method
 * @param {string} pathPattern - Route path pattern (e.g., '/:jobId/status' or '/')
 * @param {Object} reqData - Request data (body, params, query)
 * @returns {Promise<Object>} - { req, res }
 */
export async function testRoute(router, method, pathPattern, reqData = {}) {
  const methodLower = method.toLowerCase();
  
  const req = {
    body: reqData.body || {},
    params: reqData.params || {},
    query: reqData.query || {},
    method: method.toUpperCase()
  };

  const res = {
    status: jest.fn(function(code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(function(data) {
      this.data = data;
      return this;
    }),
    send: jest.fn(function(data) {
      this.data = data;
      return this;
    })
  };

  // Find the route handler
  let handler = null;
  
  // Search through router stack
  for (const layer of router.stack) {
    if (!layer.route) continue;
    
    const route = layer.route;
    const routePath = route.path;
    const hasMethod = route.methods[methodLower];
    
    if (!hasMethod) continue;
    
    // Check if path matches (exact match or pattern match for parameterized routes)
    // For parameterized routes like /:jobId/status, we check if the pattern matches
    const pathMatches = routePath === pathPattern || 
                       (routePath.includes(':') && pathPattern.includes(':') && 
                        routePath.split('/').length === pathPattern.split('/').length);
    
    if (pathMatches) {
      if (route.stack && route.stack.length > 0) {
        handler = route.stack[0].handle;
        break;
      }
    }
  }
  
  if (!handler) {
    // If exact match failed, try to find by method only (for parameterized routes)
    const route = router.stack.find(layer => {
      if (!layer.route) return false;
      return layer.route.methods[methodLower];
    });
    
    if (route && route.route && route.route.stack && route.route.stack.length > 0) {
      handler = route.route.stack[0].handle;
    } else {
      const availableRoutes = router.stack
        .filter(l => l.route)
        .map(l => `${Object.keys(l.route.methods)[0]} ${l.route.path}`)
        .join(', ');
      throw new Error(`Route ${method} ${pathPattern} not found in router. Available routes: ${availableRoutes || 'none'}`);
    }
  }

  // Call the handler
  await handler(req, res);

  return { req, res };
}

/**
 * Create a mock Skills Gap entity
 */
export function createMockSkillsGap(overrides = {}) {
  return {
    gapId: 'gap-123',
    userId: 'user-123',
    companyId: 'company-456',
    competencyTargetName: 'JavaScript ES6+ Syntax',
    skillsRawData: {
      'Competency_Front_End_Development': ['MGS_React_Hooks_Advanced', 'MGS_Flexbox_Grid_System']
    },
    examStatus: 'PASS',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides
  };
}

/**
 * Create a mock Learning Path entity
 */
export function createMockLearningPath(overrides = {}) {
  return {
    competencyTargetName: 'JavaScript ES6+ Syntax',
    userId: 'user-123',
    learningPath: {
      pathTitle: 'JavaScript Modern Development Path',
      totalSteps: 5,
      estimatedCompletion: '2025-02-01T00:00:00Z',
      totalDurationHours: 40,
      steps: [
        {
          stepNumber: 1,
          title: 'Introduction to ES6+',
          duration: '1 week',
          estimatedTime: '8 hours',
          resources: ['Resource 1', 'Resource 2'],
          objectives: ['Objective 1', 'Objective 2']
        }
      ]
    },
    approved: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides
  };
}

/**
 * Create a mock Path Approval entity
 */
export function createMockPathApproval(overrides = {}) {
  return {
    id: 'approval-123',
    learningPathId: 'path-123',
    companyId: 'company-456',
    decisionMakerId: 'emp-123',
    status: 'pending',
    feedback: null,
    approvedAt: null,
    rejectedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides
  };
}

/**
 * Create a mock Job entity
 */
export function createMockJob(overrides = {}) {
  return {
    id: 'job-123',
    userId: 'user-123',
    companyId: 'company-456',
    competencyTargetName: 'JavaScript ES6+ Syntax',
    type: 'path-generation',
    status: 'processing',
    progress: 60,
    currentStage: 'prompt-2-execution',
    result: null,
    error: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T01:00:00Z',
    ...overrides
  };
}

/**
 * Create a mock Company entity
 */
export function createMockCompany(overrides = {}) {
  return {
    companyId: 'company-456',
    companyName: 'TechCorp Inc.',
    approvalPolicy: 'auto',
    decisionMaker: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides
  };
}

/**
 * Create a mock Learner entity
 */
export function createMockLearner(overrides = {}) {
  return {
    userId: 'user-123',
    companyId: 'company-456',
    companyName: 'TechCorp Inc.',
    userName: 'Alice Johnson',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides
  };
}

