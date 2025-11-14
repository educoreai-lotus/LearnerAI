import { jest } from '@jest/globals';

/**
 * Helper utilities for testing Express routes
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
    
    // Check if path matches (exact match)
    if (routePath === pathPattern) {
      if (route.stack && route.stack.length > 0) {
        handler = route.stack[0].handle;
        break;
      }
    }
  }
  
  if (!handler) {
    // If exact match failed, try to find by method only (for parameterized routes)
    // We'll use the pathPattern as-is and let Express handle the matching
    const route = router.stack.find(layer => {
      if (!layer.route) return false;
      return layer.route.methods[methodLower];
    });
    
    if (route && route.route && route.route.stack && route.route.stack.length > 0) {
      handler = route.route.stack[0].handle;
    } else {
      throw new Error(`Route ${method} ${pathPattern} not found in router. Available routes: ${router.stack.map(l => l.route ? `${Object.keys(l.route.methods)[0]} ${l.route.path}` : 'none').join(', ')}`);
    }
  }

  // Call the handler
  await handler(req, res);

  return { req, res };
}

