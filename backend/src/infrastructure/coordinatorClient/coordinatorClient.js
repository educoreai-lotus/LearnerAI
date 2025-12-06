import axios from 'axios';
import { logger } from '../logging/Logger.js';
import { generateSignature, verifySignature } from '../../utils/signature.js';

const SERVICE_NAME = process.env.SERVICE_NAME || 'learnerAI-service';

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
 * Format public key to PEM format if needed
 */
function formatPublicKey(key) {
  if (!key) return null;
  
  // If already in PEM format, return as is
  if (key.includes('BEGIN PUBLIC KEY')) {
    return key;
  }
  
  // If it's just the base64 content, wrap it in PEM format
  const cleanKey = key.replace(/\s/g, ''); // Remove whitespace
  return `-----BEGIN PUBLIC KEY-----\n${cleanKey}\n-----END PUBLIC KEY-----`;
}

/**
 * Post request to Coordinator with ECDSA signature
 * All internal microservice calls should use this helper
 * @param {Object} envelope - Request envelope
 * @param {Object} options - Optional configuration
 * @param {string} options.endpoint - Custom endpoint (default: /api/fill-content-metrics/)
 * @param {number} options.timeout - Request timeout in ms (default: 30000)
 * @returns {Promise<Object>} Response data from Coordinator
 * @throws {Error} If request fails
 */
export async function postToCoordinator(envelope, options = {}) {
  const coordinatorUrl = process.env.COORDINATOR_URL;
  let privateKey = getPrivateKey();
  const coordinatorPublicKey = process.env.COORDINATOR_PUBLIC_KEY || null; // Optional, for response verification

  // Validate required environment variables
  if (!coordinatorUrl) {
    throw new Error('COORDINATOR_URL environment variable is required');
  }

  if (!privateKey) {
    throw new Error('LEARNERAI_PRIVATE_KEY or COORDINATOR_PRIVATE_KEY environment variable is required for signing requests');
  }

  // Format private key to PEM if needed
  privateKey = formatPrivateKey(privateKey);

  // Clean URL (remove trailing slash)
  const cleanCoordinatorUrl = coordinatorUrl.replace(/\/$/, '');
  
  // Default endpoint is /api/fill-content-metrics/ (Coordinator proxy endpoint)
  let endpoint = options.endpoint || '/api/fill-content-metrics/';
  
  // Normalize endpoint to always end with exactly one slash
  endpoint = endpoint.replace(/\/+$/, '') + '/';
  
  const url = `${cleanCoordinatorUrl}${endpoint}`;
  const timeout = options.timeout || 30000;

  try {
    // Generate ECDSA signature for the entire envelope
    const signature = generateSignature(SERVICE_NAME, privateKey, envelope);

    logger.debug('Sending request to Coordinator', {
      endpoint,
      serviceName: SERVICE_NAME
    });

    // Send POST request with signature headers
    const response = await axios.post(url, envelope, {
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': SERVICE_NAME,
        'X-Signature': signature,
      },
      timeout,
    });

    // Optional: Verify response signature if Coordinator provides one
    if (coordinatorPublicKey && response.headers['x-service-signature']) {
      const responseSignature = response.headers['x-service-signature'];
      const formattedPublicKey = formatPublicKey(coordinatorPublicKey);
      
      try {
        const isValid = verifySignature(
          'coordinator',
          formattedPublicKey,
          response.data,
          responseSignature
        );
        if (!isValid) {
          logger.warn('Response signature verification failed');
        } else {
          logger.debug('Response signature verified successfully');
        }
      } catch (verifyError) {
        logger.warn('Response signature verification error (non-blocking)', {
          error: verifyError.message,
        });
      }
    }

    return response.data;
  } catch (error) {
    logger.error('Request failed', {
      endpoint,
      error: error.message,
      status: error.response?.status,
      responseData: error.response?.data,
    });

    // Re-throw the error so callers can handle it
    throw error;
  }
}

/**
 * Get Coordinator client instance
 * @returns {Object} Coordinator client methods
 */
export function getCoordinatorClient() {
  return {
    post: postToCoordinator,
  };
}

