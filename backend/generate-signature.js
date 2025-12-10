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
    "action": "send_learning_path_to_build_course",
    "competency_target_name": "dd",
    "company_id": "550e8400-e29b-41d4-a716-446655440000",
    "company_name": "TechCorp Inc.",
    "user_name": "John Doe",
    "user_id": "10000000-0000-0000-0000-000000000001",
    "learning_path": {
      "modules": [
        {
          "module_id": "module-001",
          "module_name": "Introduction to Fundamentals",
          "module_order": 1,
          "lessons": [
            {
              "lesson_id": "lesson-001",
              "lesson_name": "Getting Started",
              "lesson_order": 1,
              "content_type": "video",
              "duration_minutes": 15,
              "description": "Introduction to the fundamentals"
            }
          ],
          "objectives": [
            "Understand the basics",
            "Learn core concepts"
          ]
        }
      ],
      "total_modules": 1,
      "estimated_duration_hours": 0.25
    }
  },
  "response": {}
};

// Service name for signature (X-Service-Name header)
// Note: This should be "learnerAI-service" even if requester_service in body is "learnerAI"
const SERVICE_NAME = 'learnerAI-service';

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

