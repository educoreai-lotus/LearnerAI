/**
 * Generate signature from body.json file
 * Usage: node generate-signature-from-body.js
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSignature } from './src/utils/signature.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPrivateKey() {
  return process.env.LEARNERAI_PRIVATE_KEY ||
         process.env['LEARNERAI_PRIVATE-KEY'] ||
         process.env.COORDINATOR_PRIVATE_KEY;
}

function formatPrivateKey(key) {
  if (!key) return null;
  
  // If already in PEM format, return as is
  if (key.includes('BEGIN PRIVATE KEY') || key.includes('BEGIN EC PRIVATE KEY') || key.includes('BEGIN ENCRYPTED PRIVATE KEY')) {
    return key;
  }
  
  // If it's a raw key, wrap it in PEM headers
  const cleanKey = key.replace(/\s/g, '');
  
  // Check if it looks like an EC private key (starts with specific patterns)
  if (cleanKey.startsWith('MHcCAQEE') || cleanKey.length < 200) {
    // EC private key format
    return `-----BEGIN EC PRIVATE KEY-----\n${cleanKey}\n-----END EC PRIVATE KEY-----`;
  } else {
    // PKCS#8 format
    return `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
  }
}

try {
  // Read body.json
  const bodyPath = path.join(__dirname, 'body.json');
  if (!fs.existsSync(bodyPath)) {
    console.error('❌ Error: body.json not found');
    console.error(`   Expected at: ${bodyPath}`);
    process.exit(1);
  }

  const requestBody = JSON.parse(fs.readFileSync(bodyPath, 'utf8'));
  // Use 'learnerAI-service' as the service name for X-Service-Name header
  // This matches the default SERVICE_NAME in CoordinatorClient
  const serviceName = 'learnerAI-service';

  // Get private key
  const privateKeyRaw = getPrivateKey();
  if (!privateKeyRaw) {
    console.error('❌ Error: LEARNERAI_PRIVATE_KEY not found in environment variables');
    console.error('   Set one of: LEARNERAI_PRIVATE_KEY, LEARNERAI_PRIVATE-KEY, or COORDINATOR_PRIVATE_KEY');
    process.exit(1);
  }

  const privateKeyPem = formatPrivateKey(privateKeyRaw);

  // Generate signature
  const signature = generateSignature(serviceName, privateKeyPem, requestBody);

  console.log('\n🔐 Signature Generated Successfully!\n');
  console.log('📋 Headers for Postman/API Request:');
  console.log('==========================================================');
  console.log(`X-Service-Name: ${serviceName}`);
  console.log(`X-Signature: ${signature}`);
  console.log('\n');
  console.log('📝 Request Body (from body.json):');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('\n');
  console.log('✅ Copy the X-Signature value above to use in your API request');
  console.log('\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exit(1);
}

