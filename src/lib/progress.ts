import type {ProgressState} from '../types';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_PREFIX = 'growth-planet:progress:v1:';

export function emptyProgress(): ProgressState {
  return {
    version: 1,
    childAlias: '',
    completedMissionIds: [],
    xp: 0,
    updatedAt: new Date(0).toISOString(),
  };
}

function isProgress(value: unknown): value is ProgressState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ProgressState>;
  return candidate.version === 1
    && typeof candidate.childAlias === 'string'
    && Array.isArray(candidate.completedMissionIds)
    && candidate.completedMissionIds.every((id) => typeof id === 'string')
    && typeof candidate.xp === 'number'
    && Number.isFinite(candidate.xp)
    && typeof candidate.updatedAt === 'string';
}

export function loadProgress(storage: StorageLike, namespace: string) {
  try {
    const stored = storage.getItem(`${STORAGE_PREFIX}${namespace}`);
    if (!stored) return emptyProgress();
    const parsed: unknown = JSON.parse(stored);
    return isProgress(parsed) ? parsed : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(storage: StorageLike, namespace: string, progress: ProgressState) {
  storage.setItem(`${STORAGE_PREFIX}${namespace}`, JSON.stringify(progress));
}

export function sanitizeAlias(alias: string) {
  return alias.replace(/[<>\n\r]/g, '').trim().slice(0, 16);
}

export function completeMission(progress: ProgressState, missionId: string, xp: number, now = new Date()) {
  if (progress.completedMissionIds.includes(missionId)) return progress;
  return {
    ...progress,
    completedMissionIds: [...progress.completedMissionIds, missionId],
    xp: progress.xp + xp,
    updatedAt: now.toISOString(),
  };
}
