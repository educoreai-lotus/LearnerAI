import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * GeminiApiClient
 * Handles all interactions with Google's Gemini API
 */
export class GeminiApiClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Model name - can be overridden via GEMINI_MODEL env variable
    // Available models: 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', etc.
    // Note: Model availability depends on your API key and region
    // Default: gemini-2.5-flash (stable, fast, good for most use cases)
    // For paid accounts: Consider using 'gemini-2.5-pro' for better reliability and higher rate limits
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.model = this.genAI.getGenerativeModel({ model: modelName });
    console.log(`✅ Using Gemini model: ${modelName}`);
    
    // Log account type hint if using paid account models
    if (modelName.includes('pro') || process.env.GEMINI_PAID_ACCOUNT === 'true') {
      console.log(`💳 Using paid account model - should have better availability and rate limits`);
    }
  }

  /**
   * Execute a prompt with the given input
   * @param {string} promptTemplate - The prompt template/instructions
   * @param {string} input - The input data for the prompt
   * @param {object} options - Additional options (retries, timeout, etc.)
   * @returns {Promise<string|object>} The AI response
   */
  async executePrompt(promptTemplate, input, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      timeout = 30000
    } = options;

    const fullPrompt = `${promptTemplate}\n\nInput:\n${input}`;

    let lastError;
    let is503Error = false;
    let actualMaxRetries = maxRetries;
    
    for (let attempt = 1; attempt <= actualMaxRetries; attempt++) {
      try {
        const result = await Promise.race([
          this._callGemini(fullPrompt),
          this._timeoutPromise(timeout)
        ]);

        return this._parseResponse(result);
      } catch (error) {
        lastError = error;
        
        // Check if this is a 503 Service Unavailable error
        const is503 = error.message?.includes('503') || 
                     error.message?.includes('Service Unavailable') ||
                     error.message?.includes('overloaded');
        
        if (is503) {
          is503Error = true;
          // For 503 errors, increase retries to at least 5 and use longer delays
          if (actualMaxRetries < 5) {
            actualMaxRetries = 5;
          }
          
          const baseDelay = 5000; // Start with 5 seconds for 503 errors
          
          console.warn(`Gemini API attempt ${attempt}/${actualMaxRetries} failed (503 Service Unavailable):`, error.message);
          
          if (attempt < actualMaxRetries) {
            // Exponential backoff with longer base delay for 503 errors
            // Attempt 1: 5s, Attempt 2: 10s, Attempt 3: 20s, Attempt 4: 40s, Attempt 5: 80s
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
            await this._sleep(delay);
          }
        } else {
          // For non-503 errors, use standard retry logic
          console.warn(`Gemini API attempt ${attempt}/${actualMaxRetries} failed:`, error.message);
          
          if (attempt < actualMaxRetries) {
            // Exponential backoff
            const delay = retryDelay * Math.pow(2, attempt - 1);
            await this._sleep(delay);
          }
        }
      }
    }

    // If we had 503 errors, provide a more helpful error message
    if (is503Error) {
      throw new Error(`Gemini API failed after ${actualMaxRetries} attempts due to service overload (503). The model is currently overloaded. Please try again later. Original error: ${lastError?.message || 'Unknown error'}`);
    }

    throw new Error(`Gemini API failed after ${actualMaxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Call Gemini API
   */
  async _callGemini(prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  /**
   * Parse response from Gemini
   * Handles JSON wrapped in markdown code blocks (```json ... ```)
   */
  _parseResponse(response) {
    if (!response) {
      throw new Error('Empty response from Gemini API');
    }

    // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
    let cleanedResponse = response.trim();
    
    // Check if response is wrapped in markdown code blocks
    if (cleanedResponse.startsWith('```')) {
      // Extract content between code blocks
      const codeBlockRegex = /^```(?:json)?\s*\n([\s\S]*?)\n```$/;
      const match = cleanedResponse.match(codeBlockRegex);
      if (match) {
        cleanedResponse = match[1].trim();
      } else {
        // Fallback: remove first ``` and last ```
        cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```$/, '').trim();
      }
    }

    // Try to parse as JSON
    try {
      return JSON.parse(cleanedResponse);
    } catch {
      // If not JSON, return as string (original response)
      return response;
    }
  }

  /**
   * Create a timeout promise
   */
  _timeoutPromise(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), ms);
    });
  }

  /**
   * Sleep utility
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

