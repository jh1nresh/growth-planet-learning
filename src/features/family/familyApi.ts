import {isChildAvatarId, type ChildProfile, type FamilySnapshot, type ProgressEnvelope} from './familyTypes';
import {parseProgressState} from '../../lib/progress';
import type {ProgressState} from '../../types';

export class FamilyApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly details?: unknown) {
    super(message);
  }
}

type AccessTokenGetter = () => Promise<string | null>;

function parseProfile(value: unknown): ChildProfile | null {
  if (!value || typeof value !== 'object') return null;
  const profile = value as Record<string, unknown>;
  if (typeof profile.id !== 'string' || typeof profile.alias !== 'string' || !isChildAvatarId(profile.avatarId)) return null;
  return {id: profile.id, alias: profile.alias, avatarId: profile.avatarId};
}

export function parseProgressEnvelope(value: unknown): ProgressEnvelope | null {
  if (!value || typeof value !== 'object') return null;
  const envelope = value as Record<string, unknown>;
  const progress = parseProgressState(envelope.progress);
  if (!progress || !Number.isInteger(envelope.revision) || (envelope.revision as number) < 1) return null;
  return {progress, revision: envelope.revision as number};
}

function parseSnapshot(value: unknown): FamilySnapshot {
  if (!value || typeof value !== 'object') throw new FamilyApiError(502, 'invalid_response', '家庭資料格式不正確。');
  const snapshot = value as Record<string, unknown>;
  if (!Array.isArray(snapshot.profiles)) throw new FamilyApiError(502, 'invalid_response', '家庭資料格式不正確。');
  const profiles = snapshot.profiles.map(parseProfile);
  if (profiles.some((profile) => !profile)) throw new FamilyApiError(502, 'invalid_response', '家庭資料格式不正確。');
  return {
    profiles: profiles as ChildProfile[],
    activeChildId: typeof snapshot.activeChildId === 'string' ? snapshot.activeChildId : null,
  };
}

async function requestJson(path: string, init: RequestInit = {}) {
  const response = await fetch(path, {...init, credentials: 'same-origin'});
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() as unknown : null;
  if (!response.ok) {
    const error = payload && typeof payload === 'object' && 'error' in payload
      ? (payload as {error?: {code?: unknown; message?: unknown; details?: unknown}}).error
      : null;
    throw new FamilyApiError(
      response.status,
      typeof error?.code === 'string' ? error.code : 'service_unavailable',
      typeof error?.message === 'string' ? error.message : '家庭資料服務暫時無法使用。',
      error?.details,
    );
  }
  return payload;
}

async function parentHeaders(getAccessToken: AccessTokenGetter, json = false) {
  const token = await getAccessToken();
  if (!token) throw new FamilyApiError(401, 'parent_auth_required', '請先使用家長帳號登入。');
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? {'Content-Type': 'application/json'} : {}),
  };
}

export function createFamilyApi(getAccessToken: AccessTokenGetter) {
  return {
    async loadDevice() {
      return parseSnapshot(await requestJson('/api/device'));
    },
    async loadFamily() {
      return parseSnapshot(await requestJson('/api/family', {headers: await parentHeaders(getAccessToken)}));
    },
    async createChild(input: {alias: string; avatarId: string; pin: string}) {
      const payload = await requestJson('/api/family', {
        method: 'POST',
        headers: await parentHeaders(getAccessToken, true),
        body: JSON.stringify(input),
      });
      const profile = payload && typeof payload === 'object' && 'profile' in payload ? parseProfile(payload.profile) : null;
      if (!profile) throw new FamilyApiError(502, 'invalid_response', '孩子檔案格式不正確。');
      return profile;
    },
    async updateChild(input: {childId: string; alias: string; avatarId: string; pin?: string}) {
      const payload = await requestJson('/api/family', {
        method: 'PATCH',
        headers: await parentHeaders(getAccessToken, true),
        body: JSON.stringify(input),
      });
      const profile = payload && typeof payload === 'object' && 'profile' in payload ? parseProfile(payload.profile) : null;
      if (!profile) throw new FamilyApiError(502, 'invalid_response', '孩子檔案格式不正確。');
      return profile;
    },
    async deleteChild(childId: string) {
      await requestJson('/api/family', {
        method: 'DELETE',
        headers: await parentHeaders(getAccessToken, true),
        body: JSON.stringify({childId}),
      });
    },
    async unlockChild(childId: string, pin: string) {
      const payload = await requestJson('/api/child-session', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({childId, pin}),
      });
      const profile = payload && typeof payload === 'object' && 'profile' in payload ? parseProfile(payload.profile) : null;
      if (!profile) throw new FamilyApiError(502, 'invalid_response', '孩子檔案格式不正確。');
      return profile;
    },
    async endChildSession() {
      await requestJson('/api/child-session', {method: 'DELETE'});
    },
    async loadProgress(childId: string): Promise<ProgressEnvelope> {
      const envelope = parseProgressEnvelope(await requestJson('/api/progress', {
        headers: {'X-Oshiami-Child-Id': childId},
      }));
      if (!envelope) throw new FamilyApiError(502, 'invalid_response', '學習進度格式不正確。');
      return envelope;
    },
    async saveProgress(childId: string, progress: ProgressState, revision: number): Promise<ProgressEnvelope> {
      const envelope = parseProgressEnvelope(await requestJson('/api/progress', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json', 'X-Oshiami-Child-Id': childId},
        body: JSON.stringify({progress, revision}),
      }));
      if (!envelope) throw new FamilyApiError(502, 'invalid_response', '學習進度格式不正確。');
      return envelope;
    },
  };
}
