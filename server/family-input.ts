import {isChildAvatarId, isChildPin, type ChildAvatarId} from '../src/features/family/familyTypes';
import {sanitizeAlias} from '../src/lib/progress';
import {ApiError} from './http';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function record(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, 'invalid_request', '送出的資料格式不正確。');
  }
  return value as Record<string, unknown>;
}

export function childIdFrom(value: unknown) {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) throw new ApiError(400, 'invalid_child_id', '孩子檔案編號不正確。');
  return value;
}

export function assertSessionChild(expectedChildId: unknown, activeChildId: string) {
  if (childIdFrom(expectedChildId) !== activeChildId) {
    throw new ApiError(409, 'child_session_changed', '已切換孩子，舊帳號的進度沒有寫入目前帳號。');
  }
}

function aliasFrom(value: unknown) {
  if (typeof value !== 'string') throw new ApiError(400, 'invalid_alias', '請輸入孩子暱稱。');
  const alias = sanitizeAlias(value);
  if (!alias) throw new ApiError(400, 'invalid_alias', '請輸入孩子暱稱。');
  return alias;
}

function avatarFrom(value: unknown): ChildAvatarId {
  if (!isChildAvatarId(value)) throw new ApiError(400, 'invalid_avatar', '請選擇 Oshiami 提供的頭像。');
  return value;
}

function pinFrom(value: unknown) {
  if (typeof value !== 'string' || !isChildPin(value)) throw new ApiError(400, 'invalid_pin', 'PIN 必須是 4 位數字。');
  return value;
}

export function parseCreateProfileInput(value: unknown) {
  const input = record(value);
  return {alias: aliasFrom(input.alias), avatarId: avatarFrom(input.avatarId), pin: pinFrom(input.pin)};
}

export function parseUpdateProfileInput(value: unknown) {
  const input = record(value);
  return {
    childId: childIdFrom(input.childId),
    alias: aliasFrom(input.alias),
    avatarId: avatarFrom(input.avatarId),
    pin: input.pin === undefined || input.pin === '' ? null : pinFrom(input.pin),
  };
}

export function parseUnlockInput(value: unknown) {
  const input = record(value);
  return {childId: childIdFrom(input.childId), pin: pinFrom(input.pin)};
}

export function parseDeleteProfileInput(value: unknown) {
  const input = record(value);
  return {childId: childIdFrom(input.childId)};
}
