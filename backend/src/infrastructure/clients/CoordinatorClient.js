import { generateSignature } from '../../utils/signature.js';

function getEnv(name, fallback = undefined) {
  const v = process.env[name];
  if (v === undefined || v === null) return fallback;
  const trimmed = typeof v === 'string' ? v.trim() : v;
  return trimmed !== '' ? trimmed : fallback;
}

function formatPrivateKeyPem(key) {
  if (!key) return null;
  const k = typeof key === 'string' ? key.trim() : key;
  if (!k) return null;

  // Accept common PEM headers as-is (including EC keys)
  if (
    k.includes('BEGIN PRIVATE KEY') ||
    k.includes('BEGIN ENCRYPTED PRIVATE KEY') ||
    k.includes('BEGIN EC PRIVATE KEY')
  ) {
    return k;
  }
  const cleanKey = String(k).replace(/\s/g, '');
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
    this.baseUrl = String(baseUrl || getEnv('COORDINATOR_URL', '') || '')
      .trim()
      .replace(/\/+$/, '');
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
    return !!(
      typeof this.baseUrl === 'string' &&
      this.baseUrl.trim().length > 0 &&
      typeof this.serviceName === 'string' &&
      this.serviceName.trim().length > 0 &&
      typeof this.privateKeyPem === 'string' &&
      this.privateKeyPem.trim().length > 0
    );
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


