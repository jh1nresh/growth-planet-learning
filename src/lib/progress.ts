import missionFile from '../data/missions.json';
import topicFile from '../data/topics.json';
import {emptyTopicStates, recordLearningEvidence} from './mastery';
import type {CurriculumFrameworkSlug, LearnerTopicState, LearningEvidence, Mission, ProgressState, Topic} from '../types';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_PREFIX = 'growth-planet:progress:v1:';
const allTopics = topicFile.topics as Topic[];
const allMissions = missionFile.missions as Mission[];
const allTopicIds = new Set(allTopics.map((topic) => topic.id));

export function emptyProgress(): ProgressState {
  return {
    version: 4,
    curriculumFramework: 'tw-108-math',
    childAlias: '',
    completedMissionIds: [],
    topicStates: emptyTopicStates(allTopics),
    xp: 0,
    updatedAt: new Date(0).toISOString(),
  };
}

export function isProgressState(value: unknown): value is ProgressState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ProgressState>;
  return candidate.version === 4
    && (candidate.curriculumFramework === 'tw-108-math' || candidate.curriculumFramework === 'cn-2022-math')
    && typeof candidate.childAlias === 'string'
    && Array.isArray(candidate.completedMissionIds)
    && candidate.completedMissionIds.every((id) => typeof id === 'string')
    && Array.isArray(candidate.topicStates)
    && candidate.topicStates.length === allTopics.length
    && new Set(candidate.topicStates.map((state) => state?.topicId)).size === allTopics.length
    && candidate.topicStates.every(isTopicState)
    && typeof candidate.xp === 'number'
    && Number.isFinite(candidate.xp)
    && typeof candidate.updatedAt === 'string';
}

function reconcileTopicStates(value: unknown): LearnerTopicState[] | null {
  if (!Array.isArray(value) || !value.every(isTopicState)) return null;
  const topicIds = value.map((state) => state.topicId);
  if (new Set(topicIds).size !== topicIds.length) return null;
  const stateById = new Map(value.map((state) => [state.topicId, state]));
  return emptyTopicStates(allTopics).map((emptyState) => stateById.get(emptyState.topicId) ?? emptyState);
}

function isTopicState(value: unknown): value is LearnerTopicState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<LearnerTopicState>;
  return typeof state.topicId === 'string'
    && allTopicIds.has(state.topicId)
    && typeof state.mastery === 'number'
    && Number.isFinite(state.mastery)
    && state.mastery >= 0
    && state.mastery <= 1
    && Number.isInteger(state.attempts)
    && (state.attempts ?? -1) >= 0
    && Number.isInteger(state.correctAttempts)
    && (state.correctAttempts ?? -1) >= 0
    && Number.isInteger(state.hintCount)
    && (state.hintCount ?? -1) >= 0
    && Number.isInteger(state.retryCount)
    && (state.retryCount ?? -1) >= 0
    && (state.lastPracticedAt === null || typeof state.lastPracticedAt === 'string');
}

function migrateV1(value: unknown): ProgressState | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as {
    version?: number;
    childAlias?: unknown;
    completedMissionIds?: unknown;
    xp?: unknown;
    updatedAt?: unknown;
  };
  if (candidate.version !== 1
    || typeof candidate.childAlias !== 'string'
    || !Array.isArray(candidate.completedMissionIds)
    || candidate.completedMissionIds.some((id: unknown) => typeof id !== 'string')
    || typeof candidate.xp !== 'number'
    || typeof candidate.updatedAt !== 'string') return null;

  const completedMissionIds = candidate.completedMissionIds as string[];
  let topicStates = emptyTopicStates(allTopics);
  const completedTopics = allMissions
    .filter((mission) => completedMissionIds.includes(mission.id))
    .flatMap((mission) => mission.topicIds);
  for (const topicId of completedTopics) {
    for (let index = 0; index < 2; index += 1) {
      topicStates = recordLearningEvidence(topicStates, {
        topicId, correct: true, hintCount: 0, retryCount: 0, occurredAt: candidate.updatedAt,
      });
    }
  }
  return {
    version: 4,
    curriculumFramework: 'tw-108-math',
    childAlias: candidate.childAlias,
    completedMissionIds,
    topicStates,
    xp: candidate.xp,
    updatedAt: candidate.updatedAt,
  };
}

function migrateV2(value: unknown): ProgressState | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 2) return null;
  return migrateV3({...candidate, version: 3, curriculumFramework: 'tw-108-math'});
}

function migrateV3(value: unknown): ProgressState | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 3
    || (candidate.curriculumFramework !== 'tw-108-math' && candidate.curriculumFramework !== 'cn-2022-math')
    || typeof candidate.childAlias !== 'string'
    || !Array.isArray(candidate.completedMissionIds)
    || candidate.completedMissionIds.some((id) => typeof id !== 'string')
    || typeof candidate.xp !== 'number'
    || !Number.isFinite(candidate.xp)
    || typeof candidate.updatedAt !== 'string') return null;
  const topicStates = reconcileTopicStates(candidate.topicStates);
  if (!topicStates) return null;
  return {
    version: 4,
    curriculumFramework: candidate.curriculumFramework,
    childAlias: candidate.childAlias,
    completedMissionIds: candidate.completedMissionIds as string[],
    topicStates,
    xp: candidate.xp,
    updatedAt: candidate.updatedAt,
  };
}

export function loadProgress(storage: StorageLike, namespace: string) {
  try {
    const stored = storage.getItem(`${STORAGE_PREFIX}${namespace}`);
    if (!stored) return emptyProgress();
    const parsed: unknown = JSON.parse(stored);
    return parseProgressState(parsed) ?? emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(storage: StorageLike, namespace: string, progress: ProgressState) {
  storage.setItem(`${STORAGE_PREFIX}${namespace}`, JSON.stringify(progress));
}

export function sanitizeAlias(alias: string) {
  return alias.normalize('NFC').replace(/[<>\u0000-\u001f\u007f]/g, '').trim().slice(0, 16);
}

export function parseProgressState(value: unknown): ProgressState | null {
  return isProgressState(value) ? value : migrateV3(value) ?? migrateV2(value) ?? migrateV1(value);
}

export function setCurriculumFramework(progress: ProgressState, curriculumFramework: CurriculumFrameworkSlug, now = new Date()): ProgressState {
  return {...progress, curriculumFramework, updatedAt: now.toISOString()};
}

export function completeMission(
  progress: ProgressState,
  missionId: string,
  xp: number,
  evidence: LearningEvidence[],
  now = new Date(),
) {
  if (progress.completedMissionIds.includes(missionId) && evidence.length === 0) return progress;
  let topicStates = progress.topicStates;
  for (const event of evidence) topicStates = recordLearningEvidence(topicStates, event);
  const alreadyComplete = progress.completedMissionIds.includes(missionId);
  return {
    ...progress,
    completedMissionIds: alreadyComplete ? progress.completedMissionIds : [...progress.completedMissionIds, missionId],
    topicStates,
    xp: progress.xp + (alreadyComplete ? 0 : xp),
    updatedAt: now.toISOString(),
  };
}

export function recordProgressEvidence(progress: ProgressState, evidence: LearningEvidence[], now = new Date()): ProgressState {
  let topicStates = progress.topicStates;
  for (const event of evidence) topicStates = recordLearningEvidence(topicStates, event);
  return {...progress, topicStates, updatedAt: now.toISOString()};
}
