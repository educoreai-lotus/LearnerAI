import crypto from 'crypto';
import { logger } from '../infrastructure/logging/Logger.js';

/**
 * Build message for ECDSA signing
 * Format: "educoreai-{serviceName}-{payloadHash}"
 * @param {string} serviceName - Service name
 * @param {Object} payload - Payload object to sign (optional)
 * @returns {string} Message string for signing
 */
export function buildMessage(serviceName, payload) {
  let message = `educoreai-${serviceName}`;
  
  if (payload) {
    // CRITICAL: Use JSON.stringify (not custom stable stringify) to match Coordinator
    const payloadString = JSON.stringify(payload);
    const payloadHash = crypto.createHash('sha256')
      .update(payloadString)
      .digest('hex');
    message = `${message}-${payloadHash}`;
  }
  
  return message;
}

/**
 * Generate ECDSA P-256 signature using DER encoding
 * Matches Coordinator's signature format (createSign().sign() defaults to DER)
 * @param {string} serviceName - Service name
 * @param {string} privateKeyPem - Private key in PEM format
 * @param {Object} payload - Payload object to sign
 * @returns {string} Base64-encoded signature (DER format, no whitespace)
 */
export function generateSignature(serviceName, privateKeyPem, payload) {
  if (!privateKeyPem || typeof privateKeyPem !== 'string') {
    throw new Error('Private key is required and must be a string');
  }

  if (!serviceName || typeof serviceName !== 'string') {
    throw new Error('Service name is required and must be a string');
  }

  try {
    // Build message for signing (unchanged - keep format identical)
    const message = buildMessage(serviceName, payload);
    
    // Create private key object from PEM string
    const privateKey = crypto.createPrivateKey({
      key: privateKeyPem,
      format: 'pem'
    });
    
    // Sign using createSign() method (defaults to DER encoding)
    // This matches Coordinator's implementation: createSign("SHA256") → sign(privateKey, "base64")
    const sign = crypto.createSign('SHA256');
    sign.update(message, 'utf8');
    sign.end();
    
    // Generate signature in DER format (default), Base64 encoded
    // Remove any whitespace/newlines to ensure clean output
    const signature = sign.sign(privateKey, 'base64').replace(/\s/g, '');
    
    return signature;
  } catch (error) {
    throw new Error(`Signature generation failed: ${error.message}`);
  }
}

/**
 * Verify ECDSA P-256 signature using DER encoding
 * Matches Coordinator's signature verification format
 * @param {string} serviceName - Service name
 * @param {string} publicKeyPem - Public key in PEM format
 * @param {Object} payload - Payload object that was signed
 * @param {string} signature - Base64-encoded signature to verify (DER format)
 * @returns {boolean} True if signature is valid
 */
export function verifySignature(serviceName, publicKeyPem, payload, signature) {
  if (!publicKeyPem || !signature) {
    return false;
  }

  try {
    // Build message (unchanged - keep format identical)
    const message = buildMessage(serviceName, payload);
    
    // Create public key object from PEM string
    const publicKey = crypto.createPublicKey({
      key: publicKeyPem,
      format: 'pem'
    });
    
    // Verify using createVerify() method (defaults to DER encoding)
    // This matches Coordinator's verification implementation
    const verify = crypto.createVerify('SHA256');
    verify.update(message, 'utf8');
    verify.end();
    
    // Remove whitespace from signature before verification
    const cleanSignature = signature.replace(/\s/g, '');
    const signatureBuffer = Buffer.from(cleanSignature, 'base64');
    
    // Verify signature (DER format is default)
    return verify.verify(publicKey, signatureBuffer);
  } catch (error) {
    logger.debug('Signature verification failed', { error: error.message });
    return false;
  }
}

