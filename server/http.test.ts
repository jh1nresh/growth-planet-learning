import {describe, expect, it} from 'vitest';
import {ApiError, assertSameOrigin, handleApiError, jsonResponse, parseJsonBody} from './http';

describe('family API boundary', () => {
  it('requires a same-origin browser mutation', () => {
    expect(() => assertSameOrigin(new Request('https://oshiami.example/api/family'))).toThrowError(ApiError);
    expect(() => assertSameOrigin(new Request('https://oshiami.example/api/family', {
      headers: {origin: 'https://attacker.example'},
    }))).toThrowError(ApiError);
    expect(() => assertSameOrigin(new Request('https://oshiami.example/api/family', {
      headers: {origin: 'https://oshiami.example'},
    }))).not.toThrow();
  });

  it('rejects invalid and oversized JSON bodies', async () => {
    await expect(parseJsonBody(new Request('https://oshiami.example/api/family', {
      method: 'POST',
      body: '{',
    }))).rejects.toMatchObject({status: 400, code: 'invalid_json'});

    await expect(parseJsonBody(new Request('https://oshiami.example/api/family', {
      method: 'POST',
      headers: {'content-length': '300001'},
      body: '{}',
    }))).rejects.toMatchObject({status: 413, code: 'payload_too_large'});
  });

  it('returns private JSON errors without leaking internal details', async () => {
    const response = handleApiError(new ApiError(409, 'progress_conflict', '請重新載入。', {revision: 3}));
    expect(response.status).toBe(409);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      error: {code: 'progress_conflict', message: '請重新載入。', details: {revision: 3}},
    });

    const success = jsonResponse({ok: true});
    expect(success.headers.get('content-type')).toContain('application/json');
  });
});
