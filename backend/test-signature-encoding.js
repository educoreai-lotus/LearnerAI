/**
 * Test script to check ECDSA signature encoding formats
 * Compares IEEE P1363 vs DER encoding
 */

import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

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

// Test message
const serviceName = 'learnerAI';
const payload = {
  "requester_service": "learnerAI",
  "payload": {
    "action": "send_learning_path",
    "competency_target_name": "dd"
  }
};

const message = `educoreai-${serviceName}`;
const payloadString = JSON.stringify(payload);
const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');
const fullMessage = `${message}-${payloadHash}`;

console.log('🔍 Testing ECDSA Signature Encoding Formats\n');
console.log('Message:', fullMessage);
console.log('');

const privateKeyPem = formatPrivateKey(getPrivateKey());
if (!privateKeyPem) {
  console.error('❌ Error: Private key not found');
  process.exit(1);
}

const privateKey = crypto.createPrivateKey({
  key: privateKeyPem,
  format: 'pem'
});

// Test 1: IEEE P1363 encoding (current implementation)
console.log('1️⃣ IEEE P1363 Encoding (Current Implementation):');
console.log('------------------------------------------------------------');
const p1363Signature = crypto.sign('sha256', Buffer.from(fullMessage, 'utf8'), {
  key: privateKey,
  dsaEncoding: 'ieee-p1363'
});
const p1363Base64 = p1363Signature.toString('base64');
console.log('Signature (Base64):', p1363Base64);
console.log('Signature Length:', p1363Signature.length, 'bytes');
console.log('');

// Test 2: DER encoding (document example)
console.log('2️⃣ DER Encoding (Document Example):');
console.log('------------------------------------------------------------');
const sign = crypto.createSign('SHA256');
sign.update(fullMessage);
sign.end();
const derSignature = sign.sign(privateKey, 'base64'); // Defaults to DER
console.log('Signature (Base64):', derSignature);
const derBuffer = Buffer.from(derSignature, 'base64');
console.log('Signature Length:', derBuffer.length, 'bytes');
console.log('');

// Test 3: Explicit DER encoding
console.log('3️⃣ Explicit DER Encoding:');
console.log('------------------------------------------------------------');
const derSignature2 = crypto.sign('sha256', Buffer.from(fullMessage, 'utf8'), {
  key: privateKey,
  dsaEncoding: 'der' // Explicit DER
});
const der2Base64 = derSignature2.toString('base64');
console.log('Signature (Base64):', der2Base64);
console.log('Signature Length:', derSignature2.length, 'bytes');
console.log('');

// Compare
console.log('📊 Comparison:');
console.log('------------------------------------------------------------');
console.log('IEEE P1363 length:', p1363Signature.length, 'bytes');
console.log('DER length (createSign):', derBuffer.length, 'bytes');
console.log('DER length (explicit):', derSignature2.length, 'bytes');
console.log('');
console.log('⚠️  Note:');
console.log('  - IEEE P1363: Fixed 64 bytes for P-256 (32 bytes r + 32 bytes s)');
console.log('  - DER: Variable length (usually 70-72 bytes for P-256)');
console.log('');

// Verify both signatures
console.log('✅ Verification Test:');
console.log('------------------------------------------------------------');

// Verify P1363
const publicKey = crypto.createPublicKey(privateKey);
const verifyP1363 = crypto.verify(
  'sha256',
  Buffer.from(fullMessage, 'utf8'),
  {
    key: publicKey,
    dsaEncoding: 'ieee-p1363'
  },
  p1363Signature
);
console.log('IEEE P1363 verification:', verifyP1363 ? '✅ Valid' : '❌ Invalid');

// Verify DER
const verifyDER = crypto.verify(
  'sha256',
  Buffer.from(fullMessage, 'utf8'),
  {
    key: publicKey,
    dsaEncoding: 'der'
  },
  derBuffer
);
console.log('DER verification:', verifyDER ? '✅ Valid' : '❌ Invalid');
console.log('');

console.log('💡 Recommendation:');
console.log('  If Coordinator expects DER encoding, change signature.js to use:');
console.log('  dsaEncoding: "der" instead of "ieee-p1363"');

