/**
 * Signature generation script matching Coordinator's implementation
 * Uses DER encoding (createSign().sign() defaults to DER)
 * 
 * Usage:
 *   node scripts/get-signature.js
 * 
 * Or set REQUEST_BODY environment variable with JSON string
 */

import dotenv from 'dotenv';
import { generateSignature, buildMessage } from '../src/utils/signature.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get private key from environment variables or file
 */
function getPrivateKey() {
  // Try environment variables first
  const envKey = process.env.LEARNERAI_PRIVATE_KEY ||
                 process.env['LEARNERAI_PRIVATE-KEY'] ||
                 process.env.COORDINATOR_PRIVATE_KEY;
  
  if (envKey) {
    return envKey;
  }
  
  // Try reading from file
  const keyPath = path.join(__dirname, '..', 'learnerAI-private-key.pem');
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath, 'utf8');
  }
  
  return null;
}

/**
 * Format private key to PEM format if needed
 */
function formatPrivateKey(key) {
  if (!key) return null;
  
  // If already in PEM format, return as is
  if (key.includes('BEGIN PRIVATE KEY') || key.includes('BEGIN ENCRYPTED PRIVATE KEY')) {
    return key;
  }
  
  // If it's just the base64 content, wrap it in PEM format
  const cleanKey = key.replace(/\s/g, ''); // Remove whitespace
  return `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
}

/**
 * Main function
 */
function main() {
  // Get request body from environment or use default
  let requestBody;
  
  if (process.env.REQUEST_BODY) {
    try {
      requestBody = JSON.parse(process.env.REQUEST_BODY);
    } catch (error) {
      console.error('❌ Error: Invalid JSON in REQUEST_BODY environment variable');
      process.exit(1);
    }
  } else {
    // Default request body (can be modified)
    requestBody = {
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
  }
  
  // Get service name from requester_service
  const serviceName = requestBody.requester_service || process.env.SERVICE_NAME || 'learnerAI-service';
  
  // Get private key
  const privateKeyRaw = getPrivateKey();
  if (!privateKeyRaw) {
    console.error('❌ Error: Private key not found');
    console.error('   Set LEARNERAI_PRIVATE_KEY environment variable or place key file');
    process.exit(1);
  }
  
  const privateKeyPem = formatPrivateKey(privateKeyRaw);
  
  try {
    // Build message (unchanged format)
    const message = buildMessage(serviceName, requestBody);
    
    // Generate signature using DER encoding
    const signature = generateSignature(serviceName, privateKeyPem, requestBody);
    
    // Output results
    console.log('🔐 Signature Generated (DER Encoding)\n');
    console.log('📋 Headers for Postman:');
    console.log('==========================================================');
    console.log(`X-Service-Name: ${serviceName}`);
    console.log(`X-Signature: ${signature}`);
    console.log('\n');
    console.log('📝 Message signed:');
    console.log(message);
    console.log('\n');
    console.log('📊 Signature Info:');
    const sigBuffer = Buffer.from(signature, 'base64');
    console.log(`Length: ${sigBuffer.length} bytes (DER encoding)`);
    console.log(`Format: DER (ASN.1)`);
    console.log('\n');
    console.log('✅ Signature ready to use');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run
main();

