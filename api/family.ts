import {getServerConfig} from '../server/config';
import {
  createApprovedDevice,
  createProfile,
  deleteProfile,
  ensureHousehold,
  getApprovedDevice,
  getChildSession,
  getDatabase,
  listProfiles,
  updateProfile,
} from '../server/database';
import {parseCreateProfileInput, parseDeleteProfileInput, parseUpdateProfileInput} from '../server/family-input';
import {assertSameOrigin, handleApiError, jsonResponse, methodNotAllowed, parseJsonBody} from '../server/http';
import {requireParent} from '../server/privy';
import {childSessionMatches, getOptionalChildSession} from '../server/session';
import {
  CHILD_SESSION_COOKIE,
  DEVICE_COOKIE,
  createOpaqueToken,
  hashOpaqueToken,
  hashPin,
  readCookie,
  serializeCookie,
} from '../server/security';
import {emptyProgress} from '../src/lib/progress';

async function familySnapshot(request: Request) {
  const config = getServerConfig();
  const parentPrivyUserId = await requireParent(request, config.privyAppId);
  const db = getDatabase(config);
  const householdId = await ensureHousehold(db, parentPrivyUserId);

  let device = null;
  const existingDeviceToken = readCookie(request, DEVICE_COOKIE);
  if (existingDeviceToken) {
    const candidate = await getApprovedDevice(db, hashOpaqueToken(existingDeviceToken, config.sessionPepper));
    if (candidate?.householdId === householdId) device = candidate;
  }

  let deviceCookie: string | null = null;
  if (!device) {
    const token = createOpaqueToken();
    device = await createApprovedDevice(db, householdId, hashOpaqueToken(token, config.sessionPepper));
    deviceCookie = serializeCookie(request, DEVICE_COOKIE, token, 30 * 24 * 60 * 60);
  }

  let activeChildId: string | null = null;
  const childToken = readCookie(request, CHILD_SESSION_COOKIE);
  if (childToken) {
    const session = await getChildSession(db, hashOpaqueToken(childToken, config.sessionPepper), device);
    activeChildId = session?.childProfileId ?? null;
  }

  const profiles = await listProfiles(db, householdId);
  return {config, db, parentPrivyUserId, householdId, profiles, activeChildId, deviceCookie};
}

export async function GET(request: Request) {
  try {
    const snapshot = await familySnapshot(request);
    const headers = new Headers();
    if (snapshot.deviceCookie) headers.append('Set-Cookie', snapshot.deviceCookie);
    return jsonResponse({profiles: snapshot.profiles, activeChildId: snapshot.activeChildId}, 200, headers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const config = getServerConfig();
    const parentPrivyUserId = await requireParent(request, config.privyAppId);
    const input = parseCreateProfileInput(await parseJsonBody(request));
    const progress = {...emptyProgress(), childAlias: input.alias};
    const profile = await createProfile(getDatabase(config), parentPrivyUserId, {
      alias: input.alias,
      avatarId: input.avatarId,
      pinHash: await hashPin(input.pin, config.sessionPepper),
      progress,
    });
    return jsonResponse({profile}, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const config = getServerConfig();
    const parentPrivyUserId = await requireParent(request, config.privyAppId);
    const input = parseUpdateProfileInput(await parseJsonBody(request));
    const db = getDatabase(config);
    let clearChildCookie = false;
    if (input.pin) {
      const householdId = await ensureHousehold(db, parentPrivyUserId);
      const currentSession = await getOptionalChildSession(request, db, config.sessionPepper, householdId);
      clearChildCookie = childSessionMatches(currentSession, input.childId);
    }
    const profile = await updateProfile(db, parentPrivyUserId, {
      childId: input.childId,
      alias: input.alias,
      avatarId: input.avatarId,
      pinHash: input.pin ? await hashPin(input.pin, config.sessionPepper) : null,
    });
    return jsonResponse(
      {profile},
      200,
      clearChildCookie ? {'Set-Cookie': serializeCookie(request, CHILD_SESSION_COOKIE, '', 0)} : undefined,
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const config = getServerConfig();
    const parentPrivyUserId = await requireParent(request, config.privyAppId);
    const {childId} = parseDeleteProfileInput(await parseJsonBody(request));
    const db = getDatabase(config);
    const householdId = await ensureHousehold(db, parentPrivyUserId);
    const currentSession = await getOptionalChildSession(request, db, config.sessionPepper, householdId);
    await deleteProfile(db, householdId, childId);
    return jsonResponse(
      {deleted: true},
      200,
      childSessionMatches(currentSession, childId)
        ? {'Set-Cookie': serializeCookie(request, CHILD_SESSION_COOKIE, '', 0)}
        : undefined,
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export default {
  fetch(request: Request) {
    if (request.method === 'GET') return GET(request);
    if (request.method === 'POST') return POST(request);
    if (request.method === 'PATCH') return PATCH(request);
    if (request.method === 'DELETE') return DELETE(request);
    return methodNotAllowed(['GET', 'POST', 'PATCH', 'DELETE']);
  },
};
