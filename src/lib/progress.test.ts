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

  it('migrates v1 progress and preserves completed mission evidence', () => {
    const storage = new MemoryStorage();
    storage.setItem('growth-planet:progress:v1:guest', JSON.stringify({
      version: 1,
      childAlias: '小星',
      completedMissionIds: ['mission_counting_harbor'],
      xp: 40,
      updatedAt: '2026-07-11T00:00:00.000Z',
    }));

    const migrated = loadProgress(storage, 'guest');
    expect(migrated.version).toBe(2);
    expect(migrated.topicStates).toHaveLength(18);
    expect(migrated.topicStates.find((state) => state.topicId === 'tw_math_g1_count_20')?.mastery).toBeGreaterThanOrEqual(0.7);
  });

  it('rejects malformed v2 topic state records', () => {
    const storage = new MemoryStorage();
    const malformed = emptyProgress();
    malformed.topicStates[0] = {...malformed.topicStates[0], mastery: Number.NaN};
    storage.setItem('growth-planet:progress:v1:guest', JSON.stringify(malformed));

    expect(loadProgress(storage, 'guest')).toEqual(emptyProgress());
  });

  it('awards XP once per mission', () => {
    const time = new Date('2026-07-11T00:00:00Z');
    const first = completeMission(emptyProgress(), 'mission-1', 40, [], time);
    const replay = completeMission(first, 'mission-1', 40, [], time);
    expect(first.xp).toBe(40);
    expect(replay).toBe(first);
  });

  it('sanitizes the local nickname', () => {
    expect(sanitizeAlias('  <小\n星>  ')).toBe('小星');
  });
});
