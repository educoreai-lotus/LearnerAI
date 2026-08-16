import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
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

function createClient(timeoutMs) {
  return new CoordinatorClient({
    baseUrl: 'https://coordinator.test',
    serviceName: 'learnerAI-service',
    privateKey: TEST_PEM,
    timeoutMs
  });
}

describe('CoordinatorClient long-running push timeout', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true })
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('keeps the default AbortController budget for ordinary fill-content-metrics calls', async () => {
    const client = createClient(60000);
    expect(client.timeoutMs).toBe(60000);

    await client.postFillContentMetrics({
      requester_service: 'learnerAI',
      payload: { action: 'not_a_push' },
      response: {}
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, fetchOptions] = globalThis.fetch.mock.calls[0];
    expect(fetchOptions.dispatcher).toBeUndefined();
    expect(fetchOptions.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(fetchOptions.body)).toEqual({
      requester_service: 'learnerAI',
      payload: { action: 'not_a_push' },
      response: {}
    });
  });

  it('does not attach a 30-minute undici dispatcher for Skills Engine 5-minute calls', async () => {
    const client = createClient(60000);

    await client.postFillContentMetrics(
      { requester_service: 'learnerAI', payload: { action: 'breakdown' }, response: {} },
      { timeoutMs: 300000 }
    );

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, fetchOptions] = globalThis.fetch.mock.calls[0];
    expect(fetchOptions.dispatcher).toBeUndefined();
  });

  it('uses a 30-minute AbortController and undici dispatcher for personalized push', async () => {
    const client = createClient(60000);

    const body = {
      requester_service: 'learnerAI',
      payload: { action: 'push_learning_path', user_id: 'user-1' },
      response: {}
    };

    await client.postFillContentMetrics(body, { timeoutMs: PUSH_LEARNING_PATH_TIMEOUT_MS });

    expect(PUSH_LEARNING_PATH_TIMEOUT_MS).toBe(30 * 60 * 1000);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, fetchOptions] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('https://coordinator.test/api/fill-content-metrics');
    expect(fetchOptions.method).toBe('POST');
    expect(fetchOptions.headers['Content-Type']).toBe('application/json');
    expect(fetchOptions.headers['X-Service-Name']).toBe('learnerAI-service');
    expect(typeof fetchOptions.headers['X-Signature']).toBe('string');
    expect(fetchOptions.headers['X-Signature'].length).toBeGreaterThan(0);
    expect(fetchOptions.signal).toBeInstanceOf(AbortSignal);
    expect(fetchOptions.dispatcher).toBeInstanceOf(Agent);
    const agentOptions = getUndiciAgentOptions(fetchOptions.dispatcher);
    expect(agentOptions).toMatchObject(
      longRunningUndiciAgentOptions(PUSH_LEARNING_PATH_TIMEOUT_MS)
    );
    expect(agentOptions.headersTimeout).toBe(30 * 60 * 1000);
    expect(agentOptions.bodyTimeout).toBe(30 * 60 * 1000);
    expect(JSON.parse(fetchOptions.body)).toEqual(body);
  });

  it('does not retry on Coordinator failure', async () => {
    globalThis.fetch.mockRejectedValue(new Error('This operation was aborted'));
    const client = createClient(60000);

    await expect(
      client.postFillContentMetrics(
        { requester_service: 'learnerAI', payload: { action: 'push_learning_path' }, response: {} },
        { timeoutMs: PUSH_LEARNING_PATH_TIMEOUT_MS }
      )
    ).rejects.toThrow('This operation was aborted');

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
