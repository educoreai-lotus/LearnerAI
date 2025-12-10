/**
 * Generate signature using DER encoding (to test if Coordinator expects DER)
 */

import dotenv from 'dotenv';
import crypto from 'crypto';
import { buildMessage } from './src/utils/signature.js';

dotenv.config();

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

const SERVICE_NAME = REQUEST_BODY.requester_service || 'learnerAI';

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

try {
  const privateKey = getPrivateKey();
  if (!privateKey) {
    console.error('❌ Error: LEARNERAI_PRIVATE_KEY not found');
    process.exit(1);
  }

  const privateKeyPem = formatPrivateKey(privateKey);
  const privateKeyObj = crypto.createPrivateKey({
    key: privateKeyPem,
    format: 'pem'
  });
  
  // Build message
  const message = buildMessage(SERVICE_NAME, REQUEST_BODY);
  
  // Generate signature using DER encoding (like document example)
  // Method 1: Using crypto.sign() with DER encoding
  const signature = crypto.sign('sha256', Buffer.from(message, 'utf8'), {
    key: privateKeyObj,
    dsaEncoding: 'der' // DER encoding instead of ieee-p1363
  });
  
  const signatureBase64 = signature.toString('base64');
  
  console.log('🔐 Signature Generated (DER Encoding)\n');
  console.log('📋 Headers for Postman:');
  console.log('==========================================================');
  console.log(`X-Service-Name: ${SERVICE_NAME}`);
  console.log(`X-Signature: ${signatureBase64}`);
  console.log('\n');
  console.log('📝 Message signed:');
  console.log(message);
  console.log('\n');
  console.log('📊 Signature Info:');
  console.log(`Length: ${signature.length} bytes (DER encoding)`);
  console.log('\n');
  console.log('⚠️  Note: This uses DER encoding instead of IEEE P1363');
  console.log('   If Coordinator expects DER, this should work!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

