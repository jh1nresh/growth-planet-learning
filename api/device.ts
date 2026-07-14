import {getServerConfig} from '../server/config';
import {getApprovedDevice, getChildSession, getDatabase, listProfiles} from '../server/database';
import {handleApiError, jsonResponse, methodNotAllowed} from '../server/http';
import {CHILD_SESSION_COOKIE, DEVICE_COOKIE, hashOpaqueToken, readCookie, serializeCookie} from '../server/security';

export async function GET(request: Request) {
  try {
    const config = getServerConfig();
    const deviceToken = readCookie(request, DEVICE_COOKIE);
    if (!deviceToken) return jsonResponse({profiles: [], activeChildId: null});

    const db = getDatabase(config);
    const device = await getApprovedDevice(db, hashOpaqueToken(deviceToken, config.sessionPepper));
    if (!device) {
      const headers = new Headers();
      headers.append('Set-Cookie', serializeCookie(request, DEVICE_COOKIE, '', 0));
      headers.append('Set-Cookie', serializeCookie(request, CHILD_SESSION_COOKIE, '', 0));
      return jsonResponse({profiles: [], activeChildId: null}, 200, headers);
    }

    const childToken = readCookie(request, CHILD_SESSION_COOKIE);
    const session = childToken
      ? await getChildSession(db, hashOpaqueToken(childToken, config.sessionPepper), device)
      : null;
    return jsonResponse({
      profiles: await listProfiles(db, device.householdId),
      activeChildId: session?.childProfileId ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export default {
  fetch(request: Request) {
    return request.method === 'GET' ? GET(request) : methodNotAllowed(['GET']);
  },
};
