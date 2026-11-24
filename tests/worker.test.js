import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

test('www redirects to the apex while preserving deep links and the query', async () => {
  const response = await worker.fetch(new Request('https://www.newplay.game/fortune/?source=share'), {});
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), 'https://newplay.game/fortune/?source=share');
});

test('the apex and preview preserve the asset service response including 404s', async () => {
  for (const host of ['newplay.game', 'preview.workers.dev']) {
    const request = new Request('https://' + host + '/missing/');
    const expected = new Response('missing', { status: 404 });
    const env = { ASSETS: { fetch: async (incoming) => { assert.equal(incoming, request); return expected; } } };
    assert.equal(await worker.fetch(request, env), expected);
  }
});
