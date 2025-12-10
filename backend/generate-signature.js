/**
 * Quick signature generator for Postman requests
 */

import dotenv from 'dotenv';
import { generateSignature, buildMessage } from './src/utils/signature.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Request body
const REQUEST_BODY = {
  "requester_service": "learnerAI",
  "payload": {
    "action": "send_learning_path",
    "competency_target_name": "dd",
    "company_id": "550e8400-e29b-41d4-a716-446655440000",
    "company_name": "TechCorp Inc.",
    "user_name": "John Doe",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "learning_path": {}
  },
  "response": {
    "answer": ""
  }
};

// Get service name from requester_service (must match body)
const SERVICE_NAME = REQUEST_BODY.requester_service || 'learnerAI-service';

// Get private key
function getPrivateKey() {
  return process.env.LEARNERAI_PRIVATE_KEY ||
         process.env['LEARNERAI_PRIVATE-KEY'] ||
         process.env.COORDINATOR_PRIVATE_KEY;
}

function formatPrivateKey(key) {
  if (!key) return null;
  if (key.includes('BEGIN PRIVATE KEY') || key.includes('BEGIN ENCRYPTED PRIVATE KEY')) {
    return key;
  }
  const cleanKey = key.replace(/\s/g, '');
  return `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
}

// Main
try {
  const privateKey = getPrivateKey();
  if (!privateKey) {
    console.error('❌ Error: LEARNERAI_PRIVATE_KEY not found in environment');
    process.exit(1);
  }

  const privateKeyPem = formatPrivateKey(privateKey);
  
  // Build message
  const message = buildMessage(SERVICE_NAME, REQUEST_BODY);
  
  // Generate signature
  const signature = generateSignature(SERVICE_NAME, privateKeyPem, REQUEST_BODY);
  
  console.log('🔐 Signature Generated\n');
  console.log('📋 Headers for Postman:');
  console.log('==========================================================');
  console.log(`X-Service-Name: ${SERVICE_NAME}`);
  console.log(`X-Signature: ${signature}`);
  console.log('\n');
  console.log('📝 Message signed:');
  console.log(message);
  console.log('\n');
  console.log('✅ Copy the headers above to Postman');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

