import {describe, expect, it} from 'vitest';
import {completeMission, emptyProgress, loadProgress, sanitizeAlias, saveProgress, type StorageLike} from './progress';

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('progress store', () => {
  it('round trips a versioned progress record', () => {
    const storage = new MemoryStorage();
    const progress = {...emptyProgress(), childAlias: '小星', xp: 40};
    saveProgress(storage, 'guest', progress);
    expect(loadProgress(storage, 'guest')).toEqual(progress);
  });

  it('awards XP once per mission', () => {
    const time = new Date('2026-07-11T00:00:00Z');
    const first = completeMission(emptyProgress(), 'mission-1', 40, time);
    const replay = completeMission(first, 'mission-1', 40, time);
    expect(first.xp).toBe(40);
    expect(replay).toBe(first);
  });

  it('sanitizes the local nickname', () => {
    expect(sanitizeAlias('  <小\n星>  ')).toBe('小星');
  });
});
