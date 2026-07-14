import {getServerConfig} from '../server/config';
import {
  clearPinAttempts,
  createChildSession,
  getDatabase,
  listProfiles,
  reservePinAttempt,
  revokeChildSession,
} from '../server/database';
import {parseUnlockInput} from '../server/family-input';
import {ApiError, assertSameOrigin, handleApiError, jsonResponse, methodNotAllowed, parseJsonBody} from '../server/http';
import {requireApprovedDevice} from '../server/session';
import {
  CHILD_SESSION_COOKIE,
  createOpaqueToken,
  hashOpaqueToken,
  readCookie,
  serializeCookie,
  verifyPin,
} from '../server/security';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const config = getServerConfig();
    const db = getDatabase(config);
    const {token: deviceToken} = await requireApprovedDevice(request, db, config.sessionPepper);
    const input = parseUnlockInput(await parseJsonBody(request));
    const attempt = await reservePinAttempt(db, hashOpaqueToken(deviceToken, config.sessionPepper), input.childId);
    if (!attempt) throw new ApiError(401, 'invalid_child_pin', '孩子檔案或 PIN 不正確。');
    if (!attempt.allowed) {
      throw new ApiError(403, 'device_reapproval_required', 'PIN 嘗試次數過多，請由家長重新登入並授權這台裝置。');
    }
    if (!attempt.pinHash || !attempt.credentialVersion || !await verifyPin(input.pin, attempt.pinHash, config.sessionPepper)) {
      throw new ApiError(401, 'invalid_child_pin', '孩子檔案或 PIN 不正確。');
    }

    await clearPinAttempts(db, attempt.deviceId, input.childId);
    const sessionToken = createOpaqueToken();
    await createChildSession(db, {
      householdId: attempt.householdId,
      childId: input.childId,
      deviceId: attempt.deviceId,
      tokenHash: hashOpaqueToken(sessionToken, config.sessionPepper),
      credentialVersion: attempt.credentialVersion,
    });
    const profile = (await listProfiles(db, attempt.householdId)).find((candidate) => candidate.id === input.childId);
    if (!profile) throw new ApiError(401, 'invalid_child_pin', '孩子檔案或 PIN 不正確。');
    return jsonResponse(
      {profile},
      200,
      {'Set-Cookie': serializeCookie(request, CHILD_SESSION_COOKIE, sessionToken, 12 * 60 * 60)},
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const token = readCookie(request, CHILD_SESSION_COOKIE);
    if (token) {
      const config = getServerConfig();
      await revokeChildSession(getDatabase(config), hashOpaqueToken(token, config.sessionPepper));
    }
    return jsonResponse(
      {signedOut: true},
      200,
      {'Set-Cookie': serializeCookie(request, CHILD_SESSION_COOKIE, '', 0)},
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export default {
  fetch(request: Request) {
    if (request.method === 'POST') return POST(request);
    if (request.method === 'DELETE') return DELETE(request);
    return methodNotAllowed(['POST', 'DELETE']);
  },
};
