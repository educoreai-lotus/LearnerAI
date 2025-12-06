import axios from 'axios';
import { logger } from '../infrastructure/logging/Logger.js';
import { generateSignature } from '../utils/signature.js';

// Service configuration
const SERVICE_NAME = process.env.SERVICE_NAME || 'learnerAI-service';
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';
const SERVICE_DESCRIPTION = process.env.SERVICE_DESCRIPTION || 'AI-powered learning path generation service';

const METADATA = {
  team: process.env.SERVICE_TEAM || 'Learning Platform Team',
  owner: process.env.SERVICE_OWNER || 'system',
  capabilities: process.env.SERVICE_CAPABILITIES 
    ? process.env.SERVICE_CAPABILITIES.split(',')
    : ['learning-path-generation', 'ai-integration', 'approval-workflow']
};

/**
 * Exponential backoff delay calculator
 */
function getBackoffDelay(attempt) {
  return Math.min(1000 * Math.pow(2, attempt), 16000);
}

/**
 * Get private key from environment variables
 * Handles both LEARNERAI_PRIVATE_KEY and LEARNERAI_PRIVATE-KEY (with hyphen)
 */
function getPrivateKey() {
  // Try underscore first (standard), then hyphen (Railway might use)
  return process.env.LEARNERAI_PRIVATE_KEY || 
         process.env['LEARNERAI_PRIVATE-KEY'] ||
         process.env.COORDINATOR_PRIVATE_KEY;
}

/**
 * Format private key to PEM format if needed
 * Handles keys that might be missing BEGIN/END markers
 */
function formatPrivateKey(key) {
  if (!key) return null;
  
  // If already in PEM format, return as is
  if (key.includes('BEGIN PRIVATE KEY') || key.includes('BEGIN PRIVATE KEY')) {
    return key;
  }
  
  // If it's just the base64 content, wrap it in PEM format
  const cleanKey = key.replace(/\s/g, ''); // Remove whitespace
  return `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
}

/**
 * Register service with Coordinator
 * @returns {Promise<{success: boolean, serviceId?: string, status?: string, error?: string}>}
 */
async function registerWithCoordinator() {
  const coordinatorUrl = process.env.COORDINATOR_URL;
  const serviceEndpoint = process.env.LEARNERAI_DOMAIN || process.env.SERVICE_ENDPOINT;
  let privateKey = getPrivateKey();

  // Validate required environment variables
  if (!coordinatorUrl) {
    const error = 'COORDINATOR_URL environment variable is required';
    logger.error(`Registration failed: ${error}`);
    return { success: false, error };
  }

  if (!serviceEndpoint) {
    const error = 'LEARNERAI_DOMAIN or SERVICE_ENDPOINT environment variable is required';
    logger.error(`Registration failed: ${error}`);
    return { success: false, error };
  }

  if (!privateKey) {
    const error = 'LEARNERAI_PRIVATE_KEY or COORDINATOR_PRIVATE_KEY environment variable is required for ECDSA signing';
    logger.error(`Registration failed: ${error}`);
    return { success: false, error };
  }

  // Format private key to PEM if needed
  privateKey = formatPrivateKey(privateKey);

  // Clean URLs (remove trailing slashes)
  const cleanCoordinatorUrl = coordinatorUrl.replace(/\/$/, '');
  const cleanServiceEndpoint = serviceEndpoint.replace(/\/$/, '');

  const registrationUrl = `${cleanCoordinatorUrl}/register`;
  
  // Build registration payload (using full format)
  const registrationPayload = {
    serviceName: SERVICE_NAME,
    version: SERVICE_VERSION,
    endpoint: cleanServiceEndpoint,
    healthCheck: '/health',
    description: SERVICE_DESCRIPTION,
    metadata: METADATA,
  };

  // Generate ECDSA signature for authentication
  let signature;
  try {
    signature = generateSignature(
      SERVICE_NAME,
      privateKey,
      registrationPayload
    );
  } catch (signatureError) {
    const error = `Failed to generate ECDSA signature: ${signatureError.message}`;
    logger.error(`Registration failed: ${error}`);
    return { success: false, error };
  }

  // Retry logic with exponential backoff (up to 5 attempts)
  const maxAttempts = 5;
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-Service-Name': SERVICE_NAME,
        'X-Signature': signature,
      };

      logger.debug(`Registration attempt ${attempt + 1}/${maxAttempts}`, {
        url: registrationUrl,
        serviceName: SERVICE_NAME,
        endpoint: cleanServiceEndpoint
      });

      const response = await axios.post(registrationUrl, registrationPayload, {
        headers: requestHeaders,
        timeout: 10000, // 10 seconds timeout
      });

      // Check if registration was successful
      if (response.status >= 200 && response.status < 300) {
        const serviceId = response.data?.serviceId || response.data?.id || 'unknown';
        const status = response.data?.status || 'pending_migration';

        logger.info('Registered with Coordinator', {
          serviceId,
          status,
          attempt: attempt + 1,
        });

        return {
          success: true,
          serviceId,
          status,
        };
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      lastError = error;

      // Determine error type and create friendly message
      let errorMessage = 'Unknown error';
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          errorMessage = `Unauthorized: Authentication failed. Please verify LEARNERAI_PRIVATE_KEY is correct.`;
        } else if (status === 404) {
          errorMessage = `Not found: Registration endpoint not available.`;
        } else {
          errorMessage = `HTTP ${status}: ${data?.message || error.response.statusText}`;
        }
      } else if (error.request) {
        errorMessage = 'No response from Coordinator service';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }

      // Log attempt
      const isLastAttempt = attempt === maxAttempts - 1;
      if (isLastAttempt) {
        logger.error(`Registration failed after ${maxAttempts} attempts: ${errorMessage}`);
      } else {
        const delay = getBackoffDelay(attempt);
        logger.warn(`Registration attempt ${attempt + 1}/${maxAttempts} failed: ${errorMessage}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  return {
    success: false,
    error: lastError?.message || 'Registration failed after all retry attempts',
  };
}

/**
 * Register service on startup
 * This function is non-blocking and will not crash the service if registration fails
 */
export async function registerService() {
  try {
    logger.info('Starting service registration with Coordinator...');
    const result = await registerWithCoordinator();

    if (!result.success) {
      logger.warn('Service registration failed, but continuing startup...', {
        error: result.error,
      });
    } else {
      logger.info('Service registration completed successfully', {
        serviceId: result.serviceId,
        status: result.status
      });
    }
  } catch (error) {
    logger.error('Unexpected error during service registration', {
      error: error.message,
      stack: error.stack,
    });
    // Don't throw - allow service to continue
  }
}

