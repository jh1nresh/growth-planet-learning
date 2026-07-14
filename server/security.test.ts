import {describe, expect, it} from 'vitest';
import {ApiError} from './http';
import {
  CHILD_SESSION_COOKIE,
  DEVICE_COOKIE,
  createOpaqueToken,
  hashOpaqueToken,
  hashPin,
  readCookie,
  serializeCookie,
  verifyPin,
} from './security';

const PEPPER = 'test-pepper-that-is-longer-than-32-characters';

describe('family credential security', () => {
  it('hashes a leading-zero PIN and never stores the PIN in the encoded value', async () => {
    const encoded = await hashPin('0123', PEPPER);

    expect(encoded).toMatch(/^scrypt\$v1\$/);
    expect(encoded).not.toContain('0123');
    await expect(verifyPin('0123', encoded, PEPPER)).resolves.toBe(true);
    await expect(verifyPin('0124', encoded, PEPPER)).resolves.toBe(false);
    await expect(verifyPin('0123', encoded, `${PEPPER}-wrong`)).resolves.toBe(false);
  });

  it('rejects malformed PIN inputs and hashes', async () => {
    await expect(hashPin('123', PEPPER)).rejects.toMatchObject({status: 400, code: 'invalid_pin'} satisfies Partial<ApiError>);
    await expect(verifyPin('1234', 'not-a-pin-hash', PEPPER)).resolves.toBe(false);
    await expect(verifyPin('abcd', await hashPin('1234', PEPPER), PEPPER)).resolves.toBe(false);
  });

  it('creates opaque random tokens and keyed token hashes', () => {
    const first = createOpaqueToken();
    const second = createOpaqueToken();

    expect(first).not.toBe(second);
    expect(hashOpaqueToken(first, PEPPER)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashOpaqueToken(first, PEPPER)).toBe(hashOpaqueToken(first, PEPPER));
    expect(hashOpaqueToken(first, PEPPER)).not.toBe(hashOpaqueToken(first, `${PEPPER}-wrong`));
  });

  it('uses host-only secure cookies in production and http-only local cookies in development', () => {
    const secureRequest = new Request('https://oshiami.example/api/device');
    const secureCookie = serializeCookie(secureRequest, DEVICE_COOKIE, 'device-token', 3600);
    expect(secureCookie).toContain('__Host-oshiami-device=');
    expect(secureCookie).toContain('Secure');
    expect(secureCookie).toContain('HttpOnly');
    expect(secureCookie).toContain('SameSite=Strict');
    expect(secureCookie).toContain('Path=/');

    const localRequest = new Request('http://localhost:3000/api/device');
    const localCookie = serializeCookie(localRequest, CHILD_SESSION_COOKIE, 'child-token', 3600);
    expect(localCookie).toContain('oshiami-child=');
    expect(localCookie).not.toContain('__Host-');
    expect(localCookie).not.toContain('Secure');
  });

  it('reads production and local cookie names without exposing them to scripts', () => {
    const request = new Request('https://oshiami.example/api/device', {
      headers: {cookie: '__Host-oshiami-device=device%20token; oshiami-child=child-token'},
    });
    expect(readCookie(request, DEVICE_COOKIE)).toBe('device token');
    expect(readCookie(request, CHILD_SESSION_COOKIE)).toBe('child-token');
  });
});
