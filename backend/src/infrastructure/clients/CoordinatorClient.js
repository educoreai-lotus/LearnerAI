import { generateSignature } from '../../utils/signature.js';

function getEnv(name, fallback = undefined) {
  const v = process.env[name];
  return v !== undefined && v !== '' ? v : fallback;
}

function formatPrivateKeyPem(key) {
  if (!key) return null;
  if (key.includes('BEGIN PRIVATE KEY') || key.includes('BEGIN ENCRYPTED PRIVATE KEY')) {
    return key;
  }
  const cleanKey = key.replace(/\s/g, '');
  return `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
}

/**
 * CoordinatorClient
 * Sends signed requests to the Coordinator service.
 *
 * Expected env vars:
 * - COORDINATOR_URL (e.g. https://coordinator.example.com)
 * - SERVICE_NAME (optional; defaults to learnerAI-service)
 * - LEARNERAI_PRIVATE_KEY (required for signing)
 */
export class CoordinatorClient {
  constructor({ baseUrl, serviceName, privateKey, timeoutMs = 20000 } = {}) {
    this.baseUrl = (baseUrl || getEnv('COORDINATOR_URL', '')).replace(/\/+$/, '');
    this.serviceName = serviceName || getEnv('SERVICE_NAME', 'learnerAI-service');
    this.privateKeyPem = formatPrivateKeyPem(
      privateKey ||
      getEnv('LEARNERAI_PRIVATE_KEY') ||
      getEnv('LEARNERAI_PRIVATE-KEY') ||
      getEnv('COORDINATOR_PRIVATE_KEY')
    );
    this.timeoutMs = timeoutMs;
  }

  isConfigured() {
    return !!(this.baseUrl && this.serviceName && this.privateKeyPem);
  }

  async postFillContentMetrics(body) {
    if (!this.baseUrl) {
      throw new Error('COORDINATOR_URL is not set');
    }
    if (!this.privateKeyPem) {
      throw new Error('LEARNERAI_PRIVATE_KEY is not set');
    }

    const signature = generateSignature(this.serviceName, this.privateKeyPem, body);
    const url = `${this.baseUrl}/api/fill-content-metrics`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': this.serviceName,
          'X-Signature': signature
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Coordinator responded ${res.status}: ${text}`);
      }

      // Coordinator often returns stringified JSON. Try parse but allow raw text.
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}


