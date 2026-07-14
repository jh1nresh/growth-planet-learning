import {createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey} from 'jose';
import {ApiError} from './http';

let cachedAppId: string | null = null;
let cachedJwks: JWTVerifyGetKey | null = null;

function getJwks(appId: string) {
  if (cachedAppId !== appId || !cachedJwks) {
    cachedAppId = appId;
    cachedJwks = createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${encodeURIComponent(appId)}/jwks.json`));
  }
  return cachedJwks;
}

export async function verifyParentAccessToken(token: string, appId: string, getKey: JWTVerifyGetKey) {
  const {payload} = await jwtVerify(token, getKey, {
    issuer: 'privy.io',
    audience: appId,
    algorithms: ['ES256'],
    typ: 'JWT',
  });
  if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') throw new Error('missing subject');
  return payload.sub;
}

export async function requireParent(request: Request, appId: string) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new ApiError(401, 'parent_auth_required', '請先使用家長帳號登入。');
  }

  try {
    return await verifyParentAccessToken(authorization.slice(7), appId, getJwks(appId));
  } catch {
    throw new ApiError(401, 'invalid_parent_session', '家長登入已失效，請重新登入。');
  }
}
