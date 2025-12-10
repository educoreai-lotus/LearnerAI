/**
 * Update migration file in Coordinator
 * Updates the existing migration file for an already-registered service
 * 
 * Usage:
 *   node scripts/update-migration.js [serviceId]
 * 
 * Required Environment Variables:
 *   - COORDINATOR_URL (defaults to https://coordinator-production-6004.up.railway.app)
 *   - LEARNERAI_PRIVATE_KEY (ECDSA private key)
 *   - SERVICE_NAME (optional, defaults to learnerAI-service)
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { generateSignature } from '../src/utils/signature.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const COORDINATOR_URL = process.env.COORDINATOR_URL || 'https://coordinator-production-6004.up.railway.app';
const SERVICE_NAME = process.env.SERVICE_NAME || 'learnerAI-service';
const SERVICE_ENDPOINT = process.env.LEARNERAI_DOMAIN || process.env.SERVICE_ENDPOINT || 'https://learnerai-production-7e11.up.railway.app';
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
 * Update migration file in Coordinator
 */
async function updateMigration(serviceId) {
  console.log('\n📋 Updating Migration File in Coordinator');
  console.log('==========================================\n');
  
  // Validate service ID
  if (!serviceId) {
    throw new Error('Service ID is required. Get it from the previous registration or Coordinator dashboard.');
  }
  
  // Validate private key
  const privateKeyRaw = getPrivateKey();
  if (!privateKeyRaw) {
    throw new Error('LEARNERAI_PRIVATE_KEY environment variable is required');
  }
  
  const privateKeyPem = formatPrivateKey(privateKeyRaw);
  
  // Check if migration file exists
  if (!fs.existsSync(MIGRATION_FILE_PATH)) {
    throw new Error(`Migration file not found: ${MIGRATION_FILE_PATH}`);
  }
  
  // Read migration file
  let migrationData;
  try {
    const fileContent = fs.readFileSync(MIGRATION_FILE_PATH, 'utf8');
    migrationData = JSON.parse(fileContent);
  } catch (error) {
    throw new Error(`Failed to read/parse migration file: ${error.message}`);
  }
  
  // Generate signature for the migration data
  let signature;
  try {
    signature = generateSignature(SERVICE_NAME, privateKeyPem, migrationData);
  } catch (signatureError) {
    throw new Error(`Failed to generate ECDSA signature: ${signatureError.message}`);
  }
  
  // Clean URL (remove trailing slash)
  const cleanCoordinatorUrl = COORDINATOR_URL.replace(/\/$/, '');
  const updateUrl = `${cleanCoordinatorUrl}/register/${serviceId}/migration`;
  
  console.log('📤 Sending migration update request...');
  console.log(`   URL: ${updateUrl}`);
  console.log(`   Service ID: ${serviceId}`);
  console.log(`   Service Name: ${SERVICE_NAME}`);
  console.log(`   Service Endpoint: ${SERVICE_ENDPOINT}`);
  console.log(`   Migration File: ${MIGRATION_FILE_PATH}\n`);
  
  let response;
  try {
    // Try PUT first (update endpoint)
    response = await axios.put(updateUrl, migrationData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': SERVICE_NAME,
        'X-Signature': signature
      },
      timeout: 30000
    });
  } catch (putError) {
    // If PUT fails with 404 or 405, try POST (some Coordinators use POST for updates)
    if (putError.response && (putError.response.status === 404 || putError.response.status === 405)) {
      console.log('   PUT not available, trying POST...\n');
      response = await axios.post(updateUrl, migrationData, {
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': SERVICE_NAME,
          'X-Signature': signature
        },
        timeout: 30000
      });
    } else {
      throw putError;
    }
  }
  
  try {
    if (response && response.status >= 200 && response.status < 300) {
      console.log('✅ Migration updated successfully!\n');
      console.log('📋 Response:');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('\n');
      
      return response.data;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        throw new Error(`Unauthorized: Authentication failed. Please verify LEARNERAI_PRIVATE_KEY is correct.`);
      } else if (status === 404) {
        throw new Error(`Not found: Service ID '${serviceId}' not found. Please verify the service ID.`);
      } else if (status === 400) {
        throw new Error(`Bad Request: ${data?.message || data?.error || 'Invalid migration file format'}`);
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
 * Main function
 */
async function main() {
  console.log('🚀 LearnerAI Migration Update');
  console.log('=============================\n');
  
  // Get service ID from command line argument
  const serviceId = process.argv[2];
  
  if (!serviceId) {
    console.error('❌ Error: Service ID is required');
    console.log('\nUsage:');
    console.log('  node scripts/update-migration.js <serviceId>');
    console.log('\nExample:');
    console.log('  node scripts/update-migration.js 64adb408-f1a3-49b3-a292-2d8c08b3fded');
    console.log('\nTo find your service ID:');
    console.log('  1. Check the previous registration output');
    console.log(`  2. Visit: ${COORDINATOR_URL}/services`);
    console.log('  3. Look for service "learnerAI-service"\n');
    process.exit(1);
  }
  
  // Validate environment variables
  console.log('🔍 Checking environment variables...\n');
  
  const missingVars = [];
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
  console.log(`   Service ID: ${serviceId}`);
  console.log(`   Migration File: ${MIGRATION_FILE_PATH}\n`);
  
  try {
    const result = await updateMigration(serviceId);
    
    console.log('🎉 Migration Update Complete!');
    console.log('============================\n');
    console.log(`✅ Migration file updated successfully for service '${SERVICE_NAME}'`);
    console.log(`📋 Service ID: ${serviceId}`);
    console.log(`🌐 Coordinator URL: ${COORDINATOR_URL}`);
    console.log(`🔗 Service Endpoint: ${SERVICE_ENDPOINT}\n`);
    
  } catch (error) {
    console.error('\n❌ Migration Update Failed:');
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
                     process.argv[1] && process.argv[1].endsWith('update-migration.js');

if (isMainModule) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

