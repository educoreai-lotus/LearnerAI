/**
 * Complete registration script for LearnerAI to Coordinator
 * Performs two-stage registration:
 * 1. Basic service registration
 * 2. Migration file upload
 * 
 * Usage:
 *   node scripts/register-to-coordinator.js
 * 
 * Required Environment Variables:
 *   - COORDINATOR_URL (e.g., https://coordinator-production-6004.up.railway.app)
 *   - LEARNERAI_DOMAIN (e.g., https://learner-ai-backend-production.up.railway.app)
 *   - LEARNERAI_PRIVATE_KEY (ECDSA private key)
 */

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSignature } from '../src/utils/signature.js';
import { uploadMigration } from '../src/registration/uploadMigration.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const COORDINATOR_URL = process.env.COORDINATOR_URL || 'https://coordinator-production-6004.up.railway.app';
const SERVICE_ENDPOINT = process.env.LEARNERAI_DOMAIN || process.env.SERVICE_ENDPOINT;
const SERVICE_NAME = process.env.SERVICE_NAME || 'learnerAI-service';
const SERVICE_VERSION = '1.0.0';
const HEALTH_CHECK_PATH = '/health';
const MIGRATION_FILE_PATH = path.join(__dirname, '../coordinator_migration.json');

/**
 * Get private key from environment variables
 */
function getPrivateKey() {
  return process.env.LEARNERAI_PRIVATE_KEY ||
         process.env['LEARNERAI_PRIVATE-KEY'] ||
         process.env.COORDINATOR_PRIVATE_KEY;
}

/**
 * Format private key to PEM format if needed
 */
function formatPrivateKey(key) {
  if (!key) return null;
  
  if (key.includes('BEGIN PRIVATE KEY') || key.includes('-----BEGIN')) {
    return key.replace(/\\n/g, '\n');
  }
  
  const cleanKey = key.replace(/\s/g, '').replace(/\\n/g, '');
  const lines = [];
  for (let i = 0; i < cleanKey.length; i += 64) {
    lines.push(cleanKey.substring(i, i + 64));
  }
  
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
}

/**
 * Stage 1: Basic Service Registration
 */
async function registerService() {
  console.log('\n📋 Stage 1: Basic Service Registration');
  console.log('==========================================\n');
  
  // Validate required fields
  if (!SERVICE_ENDPOINT) {
    throw new Error('LEARNERAI_DOMAIN or SERVICE_ENDPOINT environment variable is required');
  }
  
  const privateKey = getPrivateKey();
  if (!privateKey) {
    throw new Error('LEARNERAI_PRIVATE_KEY environment variable is required');
  }
  
  const privateKeyPem = formatPrivateKey(privateKey);
  
  // Prepare registration payload
  const registrationPayload = {
    serviceName: SERVICE_NAME,
    version: SERVICE_VERSION,
    endpoint: SERVICE_ENDPOINT,
    healthCheck: HEALTH_CHECK_PATH,
    description: 'LearnerAI microservice - AI-powered personalized learning path generation',
    metadata: {
      team: 'Team LearnerAI',
      owner: 'LearnerAI Team',
      capabilities: [
        'learning path generation',
        'skills gap analysis',
        'course recommendations',
        'path approvals',
        'AI queries',
        'inter-service communication'
      ]
    }
  };
  
  // Generate signature for registration
  const signature = generateSignature(SERVICE_NAME, privateKeyPem, registrationPayload);
  
  // Make registration request
  const registerUrl = `${COORDINATOR_URL.replace(/\/$/, '')}/register`;
  
  console.log('📤 Sending registration request...');
  console.log(`   URL: ${registerUrl}`);
  console.log(`   Service Name: ${SERVICE_NAME}`);
  console.log(`   Version: ${SERVICE_VERSION}`);
  console.log(`   Endpoint: ${SERVICE_ENDPOINT}\n`);
  
  try {
    const response = await axios.post(registerUrl, registrationPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': SERVICE_NAME,
        'X-Signature': signature
      },
      timeout: 30000
    });
    
    if (response.status >= 200 && response.status < 300) {
      console.log('✅ Stage 1 Complete: Service registered successfully!\n');
      console.log('📋 Registration Response:');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('\n');
      
      return response.data.serviceId;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        throw new Error(`Unauthorized: Authentication failed. Please verify LEARNERAI_PRIVATE_KEY is correct.`);
      } else if (status === 409) {
        throw new Error(`Conflict: Service '${SERVICE_NAME}' already exists. You may need to update instead of register.`);
      } else {
        throw new Error(`HTTP ${status}: ${data?.message || data?.error || error.response.statusText}`);
      }
    } else if (error.request) {
      throw new Error(`No response from Coordinator service. Check COORDINATOR_URL: ${COORDINATOR_URL}`);
    } else {
      throw error;
    }
  }
}

/**
 * Stage 2: Migration File Upload
 */
async function uploadMigrationFile(serviceId) {
  console.log('\n📋 Stage 2: Migration File Upload');
  console.log('==================================\n');
  
  console.log(`📤 Uploading migration file...`);
  console.log(`   Service ID: ${serviceId}`);
  console.log(`   Migration File: ${MIGRATION_FILE_PATH}\n`);
  
  // Check if migration file exists
  if (!fs.existsSync(MIGRATION_FILE_PATH)) {
    throw new Error(`Migration file not found: ${MIGRATION_FILE_PATH}`);
  }
  
  const result = await uploadMigration(serviceId, MIGRATION_FILE_PATH);
  
  if (result.success) {
    console.log('✅ Stage 2 Complete: Migration file uploaded successfully!\n');
    console.log('📋 Upload Response:');
    console.log(JSON.stringify(result.data, null, 2));
    console.log('\n');
    return result.data;
  } else {
    throw new Error(result.error || 'Migration upload failed');
  }
}

/**
 * Main registration flow
 */
async function main() {
  console.log('🚀 LearnerAI Coordinator Registration');
  console.log('=====================================\n');
  
  // Validate environment variables
  console.log('🔍 Checking environment variables...\n');
  
  const missingVars = [];
  if (!COORDINATOR_URL) missingVars.push('COORDINATOR_URL');
  if (!SERVICE_ENDPOINT) missingVars.push('LEARNERAI_DOMAIN or SERVICE_ENDPOINT');
  if (!getPrivateKey()) missingVars.push('LEARNERAI_PRIVATE_KEY');
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('\nPlease set these in your .env file or export them before running this script.\n');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated\n');
  console.log('Configuration:');
  console.log(`   Coordinator URL: ${COORDINATOR_URL}`);
  console.log(`   Service Name: ${SERVICE_NAME}`);
  console.log(`   Service Endpoint: ${SERVICE_ENDPOINT}`);
  console.log(`   Service Version: ${SERVICE_VERSION}`);
  console.log(`   Migration File: ${MIGRATION_FILE_PATH}\n`);
  
  try {
    // Stage 1: Register service
    const serviceId = await registerService();
    
    if (!serviceId) {
      throw new Error('Service ID not returned from registration');
    }
    
    // Stage 2: Upload migration
    await uploadMigrationFile(serviceId);
    
    console.log('🎉 Registration Complete!');
    console.log('========================\n');
    console.log(`✅ Service '${SERVICE_NAME}' is now registered and active in Coordinator`);
    console.log(`📋 Service ID: ${serviceId}`);
    console.log(`🌐 Coordinator URL: ${COORDINATOR_URL}`);
    console.log(`🔗 Service Endpoint: ${SERVICE_ENDPOINT}\n`);
    
  } catch (error) {
    console.error('\n❌ Registration Failed:');
    console.error(`   ${error.message}\n`);
    
    if (error.response) {
      console.error('Response details:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1] && process.argv[1].endsWith('register-to-coordinator.js');

if (isMainModule) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

