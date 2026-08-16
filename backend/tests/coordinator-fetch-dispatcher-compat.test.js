import { describe, it, expect, afterEach, jest } from '@jest/globals';
import http from 'http';
import { generateKeyPairSync } from 'crypto';
import { Agent } from 'undici';
import {
  CoordinatorClient,
  PUSH_LEARNING_PATH_TIMEOUT_MS,
  longRunningUndiciAgentOptions
} from '../src/infrastructure/clients/CoordinatorClient.js';

function getUndiciAgentOptions(agent) {
  const key = Object.getOwnPropertySymbols(agent).find((s) => String(s) === 'Symbol(options)');
  return key ? agent[key] : null;
}

const TEST_PEM = generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({
  type: 'pkcs8',
  format: 'pem'
});

function startLocalServer(handler) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
    server.on('error', reject);
  });
}

describe('Node global fetch + undici Agent dispatcher compatibility', () => {
  let server;

  afterEach(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      server = null;
    }
  });

  it('does not reject a long-running undici Agent dispatcher on actual globalThis.fetch', async () => {
    expect(jest.isMockFunction(globalThis.fetch)).toBe(false);

    const started = await startLocalServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, received: body.length }));
      });
    });
    server = started.server;

    const dispatcher = new Agent(longRunningUndiciAgentOptions(PUSH_LEARNING_PATH_TIMEOUT_MS));
    const controller = new AbortController();
    const agentOptions = getUndiciAgentOptions(dispatcher);

    expect(PUSH_LEARNING_PATH_TIMEOUT_MS).toBe(1_800_000);
    expect(agentOptions.headersTimeout).toBe(1_800_000);
    expect(agentOptions.bodyTimeout).toBe(1_800_000);

    let response;
    try {
      response = await globalThis.fetch(`${started.baseUrl}/api/fill-content-metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_service: 'learnerAI', payload: { action: 'push_learning_path' }, response: {} }),
        dispatcher,
        signal: controller.signal
      });
    } catch (error) {
      const causeMessage = error?.cause?.message || '';
      const combined = `${error?.message || ''} ${causeMessage} ${error?.cause?.code || ''}`;
      expect(combined).not.toMatch(/invalid onRequestStart method/i);
      expect(error?.cause?.code).not.toBe('UND_ERR_INVALID_ARG');
      throw error;
    } finally {
      if (typeof dispatcher.close === 'function') {
        await dispatcher.close();
      }
    }

    expect(response.ok).toBe(true);
    const json = await response.json();
    expect(json.ok).toBe(true);
  });

  it('completes CoordinatorClient personalized push through actual global fetch', async () => {
    expect(jest.isMockFunction(globalThis.fetch)).toBe(false);

    let receivedBody = null;
    const started = await startLocalServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        receivedBody = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      });
    });
    server = started.server;

    const client = new CoordinatorClient({
      baseUrl: started.baseUrl,
      serviceName: 'learnerAI-service',
      privateKey: TEST_PEM,
      timeoutMs: 60000
    });

    const body = {
      requester_service: 'learnerAI',
      payload: { action: 'push_learning_path', user_id: 'user-1' },
      response: {}
    };

    const result = await client.postFillContentMetrics(body, {
      timeoutMs: PUSH_LEARNING_PATH_TIMEOUT_MS
    });

    expect(result).toEqual({ success: true });
    expect(receivedBody).toEqual(body);
  });
});
