import {generateKeyPair, SignJWT, type JWTVerifyGetKey} from 'jose';
import {describe, expect, it} from 'vitest';
import {requireParent, verifyParentAccessToken} from './privy';

const APP_ID = 'test-privy-app';

async function fixture() {
  const {privateKey, publicKey} = await generateKeyPair('ES256');
  const getKey: JWTVerifyGetKey = async () => publicKey;
  const token = await new SignJWT({sid: 'session-1'})
    .setProtectedHeader({alg: 'ES256', typ: 'JWT'})
    .setSubject('did:privy:parent-1')
    .setIssuer('privy.io')
    .setAudience(APP_ID)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
  return {privateKey, getKey, token};
}

describe('Privy parent verification', () => {
  it('returns only the subject of a valid Privy access token', async () => {
    const {getKey, token} = await fixture();
    await expect(verifyParentAccessToken(token, APP_ID, getKey)).resolves.toBe('did:privy:parent-1');
  });

  it('rejects wrong audience, expired tokens, and missing session IDs', async () => {
    const {privateKey, getKey, token} = await fixture();
    await expect(verifyParentAccessToken(token, 'wrong-app', getKey)).rejects.toThrow();

    const expired = await new SignJWT({sid: 'session-1'})
      .setProtectedHeader({alg: 'ES256', typ: 'JWT'})
      .setSubject('did:privy:parent-1')
      .setIssuer('privy.io')
      .setAudience(APP_ID)
      .setIssuedAt(1)
      .setExpirationTime(2)
      .sign(privateKey);
    await expect(verifyParentAccessToken(expired, APP_ID, getKey)).rejects.toThrow();

    const missingSession = await new SignJWT({})
      .setProtectedHeader({alg: 'ES256', typ: 'JWT'})
      .setSubject('did:privy:parent-1')
      .setIssuer('privy.io')
      .setAudience(APP_ID)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
    await expect(verifyParentAccessToken(missingSession, APP_ID, getKey)).rejects.toThrow('missing subject');
  });

  it('requires a bearer token before attempting remote verification', async () => {
    await expect(requireParent(new Request('https://oshiami.example/api/family'), APP_ID)).rejects.toMatchObject({
      status: 401,
      code: 'parent_auth_required',
    });
  });
});
