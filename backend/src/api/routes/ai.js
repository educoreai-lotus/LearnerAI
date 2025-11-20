import express from 'express';

const router = express.Router();

/**
 * Initialize AI routes with dependencies
 */
export function createAiRouter(dependencies) {
  const { geminiClient } = dependencies;

  if (!geminiClient) {
    console.warn('⚠️  GeminiApiClient not available - AI query routes disabled');
    return router;
  }

  /**
   * POST /api/v1/ai/query
   * Generic AI query endpoint - send any prompt and get AI response
   * 
   * Body:
   * {
   *   "prompt": "string (required) - The prompt/question to send to AI",
   *   "model": "string (optional) - Model name (default: gemini-2.5-flash)",
   *   "temperature": "number (optional) - 0.0 to 1.0 (default: 0.7)",
   *   "maxTokens": "number (optional) - Max response tokens (default: 2048)",
   *   "format": "string (optional) - 'json' or 'text' (default: 'text')"
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "response": "string or object - AI response",
   *   "model": "string - Model used",
   *   "tokens": "number (optional) - Token usage if available"
   * }
   */
  router.post('/query', async (req, res) => {
    try {
      const { prompt, model, temperature, maxTokens, format = 'text' } = req.body;

      // Validate required fields
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({
          error: 'Missing or invalid prompt',
          message: 'prompt is required and must be a non-empty string'
        });
      }

      // Validate optional parameters
      if (temperature !== undefined && (typeof temperature !== 'number' || temperature < 0 || temperature > 1)) {
        return res.status(400).json({
          error: 'Invalid temperature',
          message: 'temperature must be a number between 0.0 and 1.0'
        });
      }

      if (maxTokens !== undefined && (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 8192)) {
        return res.status(400).json({
          error: 'Invalid maxTokens',
          message: 'maxTokens must be a number between 1 and 8192'
        });
      }

      if (format && !['json', 'text'].includes(format)) {
        return res.status(400).json({
          error: 'Invalid format',
          message: 'format must be either "json" or "text"'
        });
      }

      // Prepare options
      const options = {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 60000 // 60 seconds for AI queries
      };

      // If model is specified, we'd need to create a new model instance
      // For now, use the default model from GeminiApiClient
      // TODO: Support model switching if needed
      if (model) {
        console.log(`[AI Query] Model override requested: ${model} (using default model for now)`);
      }

      // Execute the prompt
      const startTime = Date.now();
      const response = await geminiClient.executePrompt(prompt, '', options);
      const duration = Date.now() - startTime;

      // Format response based on format parameter
      let formattedResponse = response;
      if (format === 'json') {
        // Try to parse as JSON if format is json
        if (typeof response === 'string') {
          try {
            formattedResponse = JSON.parse(response);
          } catch (e) {
            // If parsing fails, return as text with a note
            formattedResponse = {
              _note: 'Response is not valid JSON, returning as text',
              text: response
            };
          }
        }
      }

      // Return success response
      res.json({
        success: true,
        response: formattedResponse,
        model: model || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[AI Query] Error:', error);
      res.status(500).json({
        error: 'AI query failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/v1/ai/chat
   * Chat endpoint - supports conversation context
   * 
   * Body:
   * {
   *   "messages": [
   *     { "role": "user", "content": "Hello" },
   *     { "role": "assistant", "content": "Hi there!" },
   *     { "role": "user", "content": "What is JavaScript?" }
   *   ],
   *   "model": "string (optional)",
   *   "temperature": "number (optional)"
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "response": "string - AI response",
   *   "model": "string - Model used"
   * }
   */
  router.post('/chat', async (req, res) => {
    try {
      const { messages, model, temperature } = req.body;

      // Validate required fields
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: 'Missing or invalid messages',
          message: 'messages is required and must be a non-empty array'
        });
      }

      // Validate message structure
      for (const msg of messages) {
        if (!msg.role || !msg.content) {
          return res.status(400).json({
            error: 'Invalid message format',
            message: 'Each message must have "role" and "content" fields'
          });
        }
        if (!['user', 'assistant', 'system'].includes(msg.role)) {
          return res.status(400).json({
            error: 'Invalid message role',
            message: 'role must be "user", "assistant", or "system"'
          });
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

      res.json({
        success: true,
        response: typeof response === 'string' ? response : JSON.stringify(response),
        model: model || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[AI Chat] Error:', error);
      res.status(500).json({
        error: 'AI chat failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/v1/ai/models
   * Get available AI models
   */
  router.get('/models', async (req, res) => {
    try {
      const currentModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      
      res.json({
        success: true,
        current: currentModel,
        available: [
          'gemini-2.5-flash',
          'gemini-2.5-pro',
          'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-1.5-pro'
        ],
        note: 'Model availability depends on your API key and region. Set GEMINI_MODEL env variable to change the default model.'
      });
    } catch (error) {
      console.error('[AI Models] Error:', error);
      res.status(500).json({
        error: 'Failed to get models',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/ai/health
   * Check AI service health
   */
  router.get('/health', async (req, res) => {
    try {
      // Test with a simple prompt
      const testPrompt = 'Say "OK" if you can read this.';
      const options = {
        maxRetries: 1,
        retryDelay: 1000,
        timeout: 10000 // 10 seconds for health check
      };

      const response = await geminiClient.executePrompt(testPrompt, '', options);
      const isHealthy = response && (typeof response === 'string' ? response.length > 0 : true);

      res.json({
        status: isHealthy ? 'healthy' : 'degraded',
        service: 'Gemini AI',
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        service: 'Gemini AI',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
}

