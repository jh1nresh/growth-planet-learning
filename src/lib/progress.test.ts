import {describe, expect, it} from 'vitest';
import {createEnglishWordEvidence} from '../features/english/englishWordLessonState';
import {completeMission, emptyProgress, loadProgress, sanitizeAlias, saveProgress, setCurriculumFramework, type StorageLike} from './progress';

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
    expect(migrated.version).toBe(4);
    expect(migrated.curriculumFramework).toBe('tw-108-math');
    expect(migrated.topicStates).toHaveLength(21);
    expect(migrated.topicStates.find((state) => state.topicId === 'tw_math_g1_count_20')?.mastery).toBeGreaterThanOrEqual(0.7);
  });

  it('migrates v2 progress without changing learning evidence', () => {
    const storage = new MemoryStorage();
    const current = emptyProgress();
    const version2 = {...current, version: 2, topicStates: current.topicStates.filter((state) => !state.topicId.startsWith('tw_zh_'))};
    delete (version2 as Partial<typeof current>).curriculumFramework;
    storage.setItem('growth-planet:progress:v1:guest', JSON.stringify(version2));

    const migrated = loadProgress(storage, 'guest');
    expect(migrated.version).toBe(4);
    expect(migrated.curriculumFramework).toBe('tw-108-math');
    expect(migrated.topicStates).toEqual(current.topicStates);
  });

  it('migrates v3 progress without losing English or Mathematics evidence', () => {
    const storage = new MemoryStorage();
    const current = emptyProgress();
    const oldStates = current.topicStates.filter((state) => !state.topicId.startsWith('tw_zh_')).map((state) => {
      if (state.topicId === 'tw_eng_g1_letter_sounds') return {...state, mastery: 0.72, attempts: 1, correctAttempts: 1};
      if (state.topicId === 'tw_math_g1_tens_ones') return {...state, mastery: 0.61, attempts: 2, correctAttempts: 1, hintCount: 1};
      return state;
    });
    storage.setItem('growth-planet:progress:v1:guest', JSON.stringify({
      ...current,
      version: 3,
      childAlias: '小星',
      completedMissionIds: ['mission_english_first_dock'],
      topicStates: oldStates,
      xp: 45,
      updatedAt: '2026-07-13T00:00:00.000Z',
    }));

    const migrated = loadProgress(storage, 'guest');
    expect(migrated.version).toBe(4);
    expect(migrated.childAlias).toBe('小星');
    expect(migrated.completedMissionIds).toEqual(['mission_english_first_dock']);
    expect(migrated.xp).toBe(45);
    expect(migrated.topicStates.find((state) => state.topicId === 'tw_eng_g1_letter_sounds')).toMatchObject({mastery: 0.72, attempts: 1});
    expect(migrated.topicStates.find((state) => state.topicId === 'tw_math_g1_tens_ones')).toMatchObject({mastery: 0.61, attempts: 2, hintCount: 1});
    expect(migrated.topicStates.filter((state) => state.topicId.startsWith('tw_zh_'))).toHaveLength(3);
    expect(migrated.topicStates.filter((state) => state.topicId.startsWith('tw_zh_')).every((state) => state.mastery === 0)).toBe(true);
  });

  it('rejects malformed v4 topic state records', () => {
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

  it('records the interactive English lesson as mastery evidence', () => {
    const time = new Date('2026-07-13T00:00:00Z');
    const evidence = createEnglishWordEvidence({hintCount: 0, retryCount: 0}, time.toISOString());
    const next = completeMission(emptyProgress(), 'mission_english_first_dock', 45, [evidence], time);
    const state = next.topicStates.find((topicState) => topicState.topicId === 'tw_eng_g1_letter_sounds');

    expect(next.completedMissionIds).toContain('mission_english_first_dock');
    expect(next.xp).toBe(45);
    expect(state).toMatchObject({mastery: 0.72, attempts: 1, correctAttempts: 1, hintCount: 0, retryCount: 0});

    const replay = completeMission(next, 'mission_english_first_dock', 45, [evidence], time);
    expect(replay.xp).toBe(45);
    expect(replay.topicStates.find((topicState) => topicState.topicId === 'tw_eng_g1_letter_sounds')?.attempts).toBe(2);
  });

  it('sanitizes the local nickname', () => {
    expect(sanitizeAlias('  <小\n星>  ')).toBe('小星');
  });

  it('switches curriculum content without resetting learner progress', () => {
    const progress = {...emptyProgress(), completedMissionIds: ['mission_counting_harbor'], xp: 40};
    progress.topicStates[0] = {...progress.topicStates[0], mastery: 0.72, attempts: 2};

    const next = setCurriculumFramework(progress, 'cn-2022-math', new Date('2026-07-13T00:00:00Z'));
    expect(next.curriculumFramework).toBe('cn-2022-math');
    expect(next.completedMissionIds).toEqual(progress.completedMissionIds);
    expect(next.topicStates).toEqual(progress.topicStates);
    expect(next.xp).toBe(40);
  });
});
