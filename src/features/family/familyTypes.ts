import type {ProgressState} from '../../types';

export const CHILD_AVATARS = ['sprout', 'star', 'moon', 'cloud'] as const;

export type ChildAvatarId = typeof CHILD_AVATARS[number];

export interface ChildProfile {
  id: string;
  alias: string;
  avatarId: ChildAvatarId;
}

export interface FamilySnapshot {
  profiles: ChildProfile[];
  activeChildId: string | null;
}

export interface ProgressEnvelope {
  progress: ProgressState;
  revision: number;
}

export type ProgressSyncStatus = 'local' | 'loading' | 'synced' | 'offline' | 'conflict';

export function isChildAvatarId(value: unknown): value is ChildAvatarId {
  return typeof value === 'string' && CHILD_AVATARS.includes(value as ChildAvatarId);
}

export function isChildPin(value: string) {
  return /^\d{4}$/.test(value);
}
