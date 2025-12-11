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

// Request body - Skills Engine update_skills_gap request
const REQUEST_BODY = {
  "requester_service": "skills-engine",
  "payload": {
    "action": "update_skills_gap",
    "user_id": "b2b400ed-bc11-4aa9-a89e-f4a00d0f6321",
    "user_name": "Noam Levi",
    "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
    "company_name": "TechCorp Inc.",
    "competency_target_name": "C++ basics Noam",
    "status": "fail",
    "gap": {
      "missing_skills_map": {
        "Competency_C++_Basics": [
          "Variables and Data Types",
          "Input and Output (cin, cout)",
          "Control Flow (if, switch, loops)",
          "Functions and Parameters",
          "Scope and Lifetime of Variables",
          "Arrays and Strings",
          "Structs vs Classes",
          "Basic Object-Oriented Programming Concepts",
          "Constructors and Destructors",
          "Function Overloading",
          "Pointers (basic usage & referencing)",
          "Passing by Value vs Passing by Reference",
          "Header Files and Compilation Units",
          "std::vector and basic STL usage",
          "Basic Error Handling with try/catch"
        ]
      }
    }
  },
  "response": {
    "answer": ""
  }
};

// Service name for signature (X-Service-Name header)
// Note: This should be "learnerAI-service" (the service receiving the request)
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

