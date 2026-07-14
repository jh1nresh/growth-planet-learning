import type {SupabaseClient} from '@supabase/supabase-js';
import {getApprovedDevice, getChildSession} from './database';
import {ApiError} from './http';
import {CHILD_SESSION_COOKIE, DEVICE_COOKIE, hashOpaqueToken, readCookie} from './security';

export function childSessionMatches(session: {childProfileId: string} | null, childId: string) {
  return session?.childProfileId === childId;
}

export async function requireApprovedDevice(request: Request, db: SupabaseClient, pepper: string) {
  const token = readCookie(request, DEVICE_COOKIE);
  if (!token) throw new ApiError(401, 'device_approval_required', '請先由家長登入並授權這台裝置。');
  const device = await getApprovedDevice(db, hashOpaqueToken(token, pepper));
  if (!device) throw new ApiError(401, 'device_approval_required', '這台裝置的家庭授權已失效。');
  return {device, token};
}

export async function requireChildSession(request: Request, db: SupabaseClient, pepper: string) {
  const {device} = await requireApprovedDevice(request, db, pepper);
  const token = readCookie(request, CHILD_SESSION_COOKIE);
  if (!token) throw new ApiError(401, 'child_session_required', '請先選擇孩子並輸入 PIN。');
  const session = await getChildSession(db, hashOpaqueToken(token, pepper), device);
  if (!session) throw new ApiError(401, 'invalid_child_session', '孩子登入已失效，請重新輸入 PIN。');
  return {device, session, token};
}

export async function getOptionalChildSession(
  request: Request,
  db: SupabaseClient,
  pepper: string,
  expectedHouseholdId: string,
) {
  const deviceToken = readCookie(request, DEVICE_COOKIE);
  const childToken = readCookie(request, CHILD_SESSION_COOKIE);
  if (!deviceToken || !childToken) return null;
  const device = await getApprovedDevice(db, hashOpaqueToken(deviceToken, pepper));
  if (!device || device.householdId !== expectedHouseholdId) return null;
  return getChildSession(db, hashOpaqueToken(childToken, pepper), device);
}
