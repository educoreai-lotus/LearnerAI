import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { logger } from '../infrastructure/logging/Logger.js';
import { generateSignature } from '../utils/signature.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_NAME = process.env.SERVICE_NAME || 'learnerAI-service';

/**
 * Get private key from environment variables
 */
function getPrivateKey() {
  const keys = [
    process.env.LEARNERAI_PRIVATE_KEY,
    process.env['LEARNERAI_PRIVATE-KEY'],
    process.env.COORDINATOR_PRIVATE_KEY,
    ...Object.keys(process.env)
      .filter(key => key.includes('PRIVATE') && key.includes('KEY'))
      .map(key => process.env[key])
  ];
  
  for (const key of keys) {
    if (key && typeof key === 'string' && key.trim().length > 0) {
      return key;
    }
  }
  
  return null;
}

/**
 * Format private key to PEM format if needed
 */
function formatPrivateKey(key) {
  if (!key) return null;
  
  // If already in PEM format, return as is (handle both variations)
  if (key.includes('BEGIN PRIVATE KEY') || key.includes('-----BEGIN')) {
    // Ensure proper line breaks
    return key.replace(/\\n/g, '\n');
  }
  
  // If it's base64 only, wrap it in PEM format
  // Remove all whitespace first
  const cleanKey = key.replace(/\s/g, '').replace(/\\n/g, '');
  
  // Split into 64-character lines (PEM standard)
  const lines = [];
  for (let i = 0; i < cleanKey.length; i += 64) {
    lines.push(cleanKey.substring(i, i + 64));
  }
  
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
}

/**
 * Upload migration file to Coordinator
 * @param {string} serviceId - Service ID from registration
 * @param {string} migrationFilePath - Path to migration JSON file
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function uploadMigration(serviceId, migrationFilePath = null) {
  const coordinatorUrl = process.env.COORDINATOR_URL;
  let privateKey = getPrivateKey();

  // Validate required environment variables
  if (!coordinatorUrl) {
    const error = 'COORDINATOR_URL environment variable is required';
    logger.error(`Migration upload failed: ${error}`);
    return { success: false, error };
  }

  if (!serviceId) {
    const error = 'Service ID is required. Get it from the registration response.';
    logger.error(`Migration upload failed: ${error}`);
    return { success: false, error };
  }

  if (!privateKey) {
    const error = 'LEARNERAI_PRIVATE_KEY or COORDINATOR_PRIVATE_KEY environment variable is required';
    logger.error(`Migration upload failed: ${error}`);
    return { success: false, error };
  }

  // Format private key to PEM if needed
  privateKey = formatPrivateKey(privateKey);

  // Validate private key can be parsed (test before using)
  try {
    const crypto = await import('crypto');
    crypto.createPrivateKey({
      key: privateKey,
      format: 'pem'
    });
  } catch (keyError) {
    const error = `Invalid private key format: ${keyError.message}. Please check LEARNERAI_PRIVATE_KEY. It should be either full PEM format or base64 only.`;
    logger.error(`Migration upload failed: ${error}`);
    return { success: false, error };
  }

  // Default migration file path
  if (!migrationFilePath) {
    // Go up from src/registration to backend root
    migrationFilePath = path.join(__dirname, '../../coordinator_migration.json');
  }

  // Check if migration file exists
  if (!fs.existsSync(migrationFilePath)) {
    const error = `Migration file not found: ${migrationFilePath}`;
    logger.error(`Migration upload failed: ${error}`);
    return { success: false, error };
  }

  // Read migration file
  let migrationData;
  try {
    const fileContent = fs.readFileSync(migrationFilePath, 'utf8');
    migrationData = JSON.parse(fileContent);
  } catch (error) {
    const errorMsg = `Failed to read/parse migration file: ${error.message}`;
    logger.error(`Migration upload failed: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  // Clean URL (remove trailing slash)
  const cleanCoordinatorUrl = coordinatorUrl.replace(/\/$/, '');
  const uploadUrl = `${cleanCoordinatorUrl}/register/${serviceId}/migration`;

  // Generate ECDSA signature for the migration data
  let signature;
  try {
    // Debug: Log key format info (without exposing the key)
    const keyPreview = privateKey.substring(0, 50) + '...';
    logger.debug('Private key format check', {
      hasPEMHeaders: privateKey.includes('BEGIN'),
      keyLength: privateKey.length,
      keyPreview: keyPreview
    });

    signature = generateSignature(
      SERVICE_NAME,
      privateKey,
      migrationData
    );
  } catch (signatureError) {
    const error = `Failed to generate ECDSA signature: ${signatureError.message}`;
    logger.error(`Migration upload failed: ${error}`);
    logger.error('Key format issue. Ensure LEARNERAI_PRIVATE_KEY is either:');
    logger.error('  1. Full PEM format with -----BEGIN PRIVATE KEY----- headers');
    logger.error('  2. Base64 only (will be auto-formatted)');
    logger.error('  3. Check for escaped newlines (\\n vs actual newlines)');
    return { success: false, error };
  }

  // Retry logic with exponential backoff (up to 3 attempts)
  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-Service-Name': SERVICE_NAME,
        'X-Signature': signature,
      };

      logger.info(`Uploading migration file (attempt ${attempt + 1}/${maxAttempts})...`, {
        url: uploadUrl,
        serviceId,
        file: migrationFilePath
      });

      const response = await axios.post(uploadUrl, migrationData, {
        headers: requestHeaders,
        timeout: 30000, // 30 seconds timeout
      });

      // Check if upload was successful
      if (response.status >= 200 && response.status < 300) {
        logger.info('Migration file uploaded successfully', {
          serviceId,
          status: response.data?.status || 'unknown',
          attempt: attempt + 1,
        });

        return {
          success: true,
          message: 'Migration file uploaded successfully',
          data: response.data
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
          errorMessage = `Not found: Service ID not found or migration endpoint not available.`;
        } else if (status === 400) {
          errorMessage = `Bad Request: ${data?.message || 'Invalid migration file format'}`;
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
        logger.error(`Migration upload failed after ${maxAttempts} attempts: ${errorMessage}`);
      } else {
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
        logger.warn(`Migration upload attempt ${attempt + 1}/${maxAttempts} failed: ${errorMessage}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  return {
    success: false,
    error: lastError?.message || 'Migration upload failed after all retry attempts',
  };
}

/**
 * CLI usage: node uploadMigration.js <serviceId> [migrationFilePath]
 */
// Check if this is being run directly (not imported)
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1] && process.argv[1].endsWith('uploadMigration.js');

if (isMainModule) {
  const serviceId = process.argv[2];
  const migrationFilePath = process.argv[3] || null;

  if (!serviceId) {
    console.error('❌ Error: Service ID is required');
    console.log('\nUsage:');
    console.log('  node src/registration/uploadMigration.js <serviceId> [migrationFilePath]');
    console.log('\nExample:');
    console.log('  node src/registration/uploadMigration.js 550e8400-e29b-41d4-a716-446655440000');
    console.log('  node src/registration/uploadMigration.js 550e8400-e29b-41d4-a716-446655440000 ./coordinator_migration.json');
    console.log('\nRequired Environment Variables:');
    console.log('  - COORDINATOR_URL');
    console.log('  - LEARNERAI_PRIVATE_KEY or COORDINATOR_PRIVATE_KEY');
    console.log('  - SERVICE_NAME (optional, defaults to learnerAI-service)');
    process.exit(1);
  }

  // Check environment variables
  if (!process.env.COORDINATOR_URL) {
    console.error('❌ Error: COORDINATOR_URL environment variable is required');
    console.log('   Set it in .env file or export it before running the script');
    process.exit(1);
  }

  if (!getPrivateKey()) {
    console.error('❌ Error: LEARNERAI_PRIVATE_KEY or COORDINATOR_PRIVATE_KEY environment variable is required');
    console.log('   Set it in .env file or export it before running the script');
    process.exit(1);
  }

  console.log('🚀 Starting migration upload...');
  console.log(`   Service ID: ${serviceId}`);
  console.log(`   Coordinator URL: ${process.env.COORDINATOR_URL}`);
  console.log(`   Service Name: ${SERVICE_NAME}\n`);

  uploadMigration(serviceId, migrationFilePath)
    .then(result => {
      if (result.success) {
        console.log('\n✅ Migration uploaded successfully!');
        console.log('📋 Response:', JSON.stringify(result.data, null, 2));
        process.exit(0);
      } else {
        console.error('\n❌ Migration upload failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Unexpected error:', error.message);
      console.error('Stack:', error.stack);
      process.exit(1);
    });
}

