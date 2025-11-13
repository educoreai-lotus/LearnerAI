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
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.model = this.genAI.getGenerativeModel({ model: modelName });
    console.log(`✅ Using Gemini model: ${modelName}`);
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
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          this._callGemini(fullPrompt),
          this._timeoutPromise(timeout)
        ]);

        return this._parseResponse(result);
      } catch (error) {
        lastError = error;
        console.warn(`Gemini API attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await this._sleep(delay);
        }
      }
    }

    throw new Error(`Gemini API failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
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
   */
  _parseResponse(response) {
    if (!response) {
      throw new Error('Empty response from Gemini API');
    }

    // Try to parse as JSON first
    try {
      return JSON.parse(response);
    } catch {
      // If not JSON, return as string
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

