import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {isChildAvatarId, type ChildProfile, type ProgressEnvelope} from '../src/features/family/familyTypes';
import {parseProgressState} from '../src/lib/progress';
import type {ProgressState} from '../src/types';
import type {ServerConfig} from './config';
import {ApiError} from './http';

type DatabaseClient = SupabaseClient;

export interface ApprovedDevice {
  id: string;
  householdId: string;
}

export interface ChildSession {
  id: string;
  childProfileId: string;
  deviceId: string;
  householdId: string;
}

interface ReservedPinAttempt {
  allowed: boolean;
  pinHash: string | null;
  credentialVersion: number | null;
  deviceId: string;
  householdId: string;
}

let cachedDatabase: {url: string; key: string; client: DatabaseClient} | null = null;

export function getDatabase(config: ServerConfig) {
  if (!cachedDatabase || cachedDatabase.url !== config.supabaseUrl || cachedDatabase.key !== config.supabaseSecretKey) {
    cachedDatabase = {
      url: config.supabaseUrl,
      key: config.supabaseSecretKey,
      client: createClient(config.supabaseUrl, config.supabaseSecretKey, {
        auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
      }),
    };
  }
  return cachedDatabase.client;
}

function databaseFailure(context: string, error: {message?: string} | null) {
  console.error(`Oshiami database ${context} failed`, error?.message ?? 'unknown database error');
  return new ApiError(503, 'database_unavailable', '家庭資料服務暫時無法使用，請稍後再試。');
}

function mapProfile(row: Record<string, unknown>): ChildProfile {
  const id = row.id ?? row.profile_id;
  const alias = row.alias ?? row.profile_alias;
  const avatarId = row.avatar_id ?? row.profile_avatar_id;
  if (typeof id !== 'string' || typeof alias !== 'string' || !isChildAvatarId(avatarId)) {
    throw new ApiError(500, 'invalid_database_record', '家庭資料格式不正確。');
  }
  return {id, alias, avatarId};
}

export async function ensureHousehold(db: DatabaseClient, parentPrivyUserId: string) {
  const upsert = await db
    .from('households')
    .upsert({parent_privy_user_id: parentPrivyUserId}, {onConflict: 'parent_privy_user_id', ignoreDuplicates: true})
    .select('id')
    .maybeSingle();
  if (upsert.error) throw databaseFailure('ensure household', upsert.error);
  if (typeof upsert.data?.id === 'string') return upsert.data.id;

  const existing = await db.from('households').select('id').eq('parent_privy_user_id', parentPrivyUserId).maybeSingle();
  if (existing.error) throw databaseFailure('find household', existing.error);
  if (typeof existing.data?.id !== 'string') throw new ApiError(500, 'household_missing', '無法建立家庭帳號。');
  return existing.data.id;
}

export async function listProfiles(db: DatabaseClient, householdId: string) {
  const result = await db
    .from('child_profiles')
    .select('id, alias, avatar_id')
    .eq('household_id', householdId)
    .order('created_at', {ascending: true});
  if (result.error) throw databaseFailure('list profiles', result.error);
  return (result.data ?? []).map((row) => mapProfile(row));
}

export async function createProfile(
  db: DatabaseClient,
  parentPrivyUserId: string,
  input: {alias: string; avatarId: string; pinHash: string; progress: ProgressState},
) {
  const result = await db.rpc('oshiami_create_child_profile', {
    p_parent_privy_user_id: parentPrivyUserId,
    p_alias: input.alias,
    p_avatar_id: input.avatarId,
    p_pin_hash: input.pinHash,
    p_progress: input.progress,
  });
  if (result.error?.message.includes('child_profile_limit')) {
    throw new ApiError(409, 'child_profile_limit', '一個家庭最多建立 8 個孩子檔案。');
  }
  if (result.error) throw databaseFailure('create profile', result.error);
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!row || typeof row !== 'object') throw new ApiError(500, 'profile_missing', '孩子檔案沒有成功建立。');
  return mapProfile(row as Record<string, unknown>);
}

export async function updateProfile(
  db: DatabaseClient,
  parentPrivyUserId: string,
  input: {childId: string; alias: string; avatarId: string; pinHash: string | null},
) {
  const result = await db.rpc('oshiami_update_child_profile', {
    p_parent_privy_user_id: parentPrivyUserId,
    p_child_profile_id: input.childId,
    p_alias: input.alias,
    p_avatar_id: input.avatarId,
    p_pin_hash: input.pinHash,
  });
  if (result.error) throw databaseFailure('update profile', result.error);
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!row || typeof row !== 'object') throw new ApiError(404, 'profile_not_found', '找不到這個孩子檔案。');
  return mapProfile(row as Record<string, unknown>);
}

export async function deleteProfile(db: DatabaseClient, householdId: string, childId: string) {
  const result = await db
    .from('child_profiles')
    .delete()
    .eq('id', childId)
    .eq('household_id', householdId)
    .select('id')
    .maybeSingle();
  if (result.error) throw databaseFailure('delete profile', result.error);
  if (!result.data) throw new ApiError(404, 'profile_not_found', '找不到這個孩子檔案。');
}

export async function getApprovedDevice(db: DatabaseClient, tokenHash: string) {
  const now = new Date().toISOString();
  const result = await db
    .from('approved_devices')
    .select('id, household_id')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', now)
    .maybeSingle();
  if (result.error) throw databaseFailure('get approved device', result.error);
  if (!result.data) return null;
  return {id: result.data.id as string, householdId: result.data.household_id as string} satisfies ApprovedDevice;
}

export async function createApprovedDevice(db: DatabaseClient, householdId: string, tokenHash: string) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const result = await db
    .from('approved_devices')
    .insert({household_id: householdId, token_hash: tokenHash, expires_at: expiresAt})
    .select('id, household_id')
    .single();
  if (result.error) throw databaseFailure('create approved device', result.error);
  return {id: result.data.id as string, householdId: result.data.household_id as string} satisfies ApprovedDevice;
}

export async function reservePinAttempt(db: DatabaseClient, deviceTokenHash: string, childId: string) {
  const result = await db.rpc('oshiami_reserve_pin_attempt', {
    p_device_token_hash: deviceTokenHash,
    p_child_profile_id: childId,
  });
  if (result.error) throw databaseFailure('reserve pin attempt', result.error);
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!row || typeof row !== 'object') return null;
  const record = row as Record<string, unknown>;
  if (typeof record.allowed !== 'boolean' || typeof record.device_id !== 'string' || typeof record.household_id !== 'string') return null;
  return {
    allowed: record.allowed,
    pinHash: typeof record.pin_hash === 'string' ? record.pin_hash : null,
    credentialVersion: Number.isInteger(record.credential_version) ? record.credential_version as number : null,
    deviceId: record.device_id,
    householdId: record.household_id,
  } satisfies ReservedPinAttempt;
}

export async function clearPinAttempts(db: DatabaseClient, deviceId: string, childId: string) {
  const result = await db.from('child_pin_attempts').delete().eq('device_id', deviceId).eq('child_profile_id', childId);
  if (result.error) throw databaseFailure('clear pin attempts', result.error);
}

export async function createChildSession(db: DatabaseClient, input: {
  householdId: string;
  childId: string;
  deviceId: string;
  tokenHash: string;
  credentialVersion: number;
}) {
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  const result = await db.rpc('oshiami_create_child_session', {
    p_household_id: input.householdId,
    p_child_profile_id: input.childId,
    p_device_id: input.deviceId,
    p_token_hash: input.tokenHash,
    p_expires_at: expiresAt,
    p_credential_version: input.credentialVersion,
  });
  if (result.error) throw databaseFailure('create child session', result.error);
  if (result.data !== true) throw new ApiError(409, 'child_credential_changed', 'PIN 已由家長更新，請使用新 PIN 再試。');
}

export async function getChildSession(db: DatabaseClient, sessionTokenHash: string, device: ApprovedDevice) {
  const result = await db
    .from('child_sessions')
    .select('id, household_id, child_profile_id, device_id')
    .eq('token_hash', sessionTokenHash)
    .eq('device_id', device.id)
    .eq('household_id', device.householdId)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (result.error) throw databaseFailure('get child session', result.error);
  if (!result.data) return null;
  return {
    id: result.data.id as string,
    householdId: result.data.household_id as string,
    childProfileId: result.data.child_profile_id as string,
    deviceId: result.data.device_id as string,
  } satisfies ChildSession;
}

export async function revokeChildSession(db: DatabaseClient, sessionTokenHash: string) {
  const result = await db
    .from('child_sessions')
    .update({revoked_at: new Date().toISOString()})
    .eq('token_hash', sessionTokenHash)
    .is('revoked_at', null);
  if (result.error) throw databaseFailure('revoke child session', result.error);
}

async function getProfileAlias(db: DatabaseClient, session: ChildSession) {
  const result = await db
    .from('child_profiles')
    .select('alias')
    .eq('id', session.childProfileId)
    .eq('household_id', session.householdId)
    .maybeSingle();
  if (result.error) throw databaseFailure('get profile alias', result.error);
  if (typeof result.data?.alias !== 'string') throw new ApiError(401, 'invalid_child_session', '孩子登入已失效。');
  return result.data.alias;
}

export async function getProgress(db: DatabaseClient, session: ChildSession): Promise<ProgressEnvelope> {
  const [alias, result] = await Promise.all([
    getProfileAlias(db, session),
    db.from('child_progress').select('state, revision').eq('child_profile_id', session.childProfileId).maybeSingle(),
  ]);
  if (result.error) throw databaseFailure('get progress', result.error);
  const progress = parseProgressState(result.data?.state);
  const revision = result.data?.revision;
  if (!progress || !Number.isInteger(revision)) throw new ApiError(500, 'invalid_progress_record', '學習進度格式不正確。');
  return {progress: {...progress, childAlias: alias}, revision: revision as number};
}

export async function saveProgress(
  db: DatabaseClient,
  session: ChildSession,
  progress: ProgressState,
  expectedRevision: number,
) {
  const alias = await getProfileAlias(db, session);
  const nextProgress = {...progress, childAlias: alias};
  const result = await db
    .from('child_progress')
    .update({state: nextProgress, revision: expectedRevision + 1, updated_at: new Date().toISOString()})
    .eq('child_profile_id', session.childProfileId)
    .eq('revision', expectedRevision)
    .select('state, revision')
    .maybeSingle();
  if (result.error) throw databaseFailure('save progress', result.error);
  if (!result.data) return {conflict: true as const, current: await getProgress(db, session)};
  const saved = parseProgressState(result.data.state);
  if (!saved || !Number.isInteger(result.data.revision)) throw new ApiError(500, 'invalid_progress_record', '學習進度格式不正確。');
  return {conflict: false as const, current: {progress: saved, revision: result.data.revision as number}};
}
