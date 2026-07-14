import {useCallback, useEffect, useMemo, useState} from 'react';
import {completeMission as addMission, loadProgress, recordProgressEvidence, sanitizeAlias, saveProgress, setCurriculumFramework as selectCurriculumFramework, type StorageLike} from '../lib/progress';
import type {LessonEvidenceSummary} from '../features/lessons/PlaceValueLesson';
import {createPlaceValueEvidence} from '../features/lessons/placeValueEvidence';
import {createEnglishWordEvidence, ENGLISH_WORD_MISSION_ID, type EnglishWordLessonSummary} from '../features/english/englishWordLessonState';
import {createEnglishSpeakingEvidence, type EnglishSpeakingLessonSummary} from '../features/english/englishSpeakingLessonState';
import {createEnglishCardEvidence, type EnglishCardLessonSummary} from '../features/english/englishCardLessonState';
import type {EnglishCourseScenario} from '../features/english/englishCourse';
import {createChineseZhuyinEvidence, type ChineseZhuyinLessonSummary} from '../features/chinese/chineseZhuyinLessonState';
import type {CurriculumFrameworkSlug, LearningEvidence, Mission, ProgressState} from '../types';

interface ProgressSnapshot {
  namespace: string;
  progress: ProgressState;
}

type ProgressUpdate = (progress: ProgressState) => ProgressState;

function resolveProgressSnapshot(storage: StorageLike, namespace: string, snapshot: ProgressSnapshot): ProgressSnapshot {
  return snapshot.namespace === namespace
    ? snapshot
    : {namespace, progress: loadProgress(storage, namespace)};
}

function updateProgressSnapshot(
  storage: StorageLike,
  namespace: string,
  snapshot: ProgressSnapshot,
  createNext: ProgressUpdate,
): ProgressSnapshot {
  const current = resolveProgressSnapshot(storage, namespace, snapshot);
  const next = {namespace, progress: createNext(current.progress)};
  saveProgress(storage, namespace, next.progress);
  return next;
}

export function useProgress(namespace: string) {
  const [storedSnapshot, setStoredSnapshot] = useState<ProgressSnapshot>(() => ({
    namespace,
    progress: loadProgress(window.localStorage, namespace),
  }));
  const snapshot = useMemo(
    () => resolveProgressSnapshot(window.localStorage, namespace, storedSnapshot),
    [namespace, storedSnapshot],
  );
  const progress = snapshot.progress;

  useEffect(() => {
    setStoredSnapshot((current) => resolveProgressSnapshot(window.localStorage, namespace, current));
  }, [namespace]);

  const update = useCallback((createNext: ProgressUpdate) => {
    setStoredSnapshot(updateProgressSnapshot(window.localStorage, namespace, storedSnapshot, createNext));
  }, [namespace, storedSnapshot]);

  const setChildAlias = useCallback((alias: string) => {
    update((current) => ({...current, childAlias: sanitizeAlias(alias), updatedAt: new Date().toISOString()}));
  }, [update]);

  const setCurriculumFramework = useCallback((curriculumFramework: CurriculumFrameworkSlug) => {
    update((current) => selectCurriculumFramework(current, curriculumFramework));
  }, [update]);

  const completeMission = useCallback((mission: Mission, summary: LessonEvidenceSummary) => {
    const occurredAt = new Date().toISOString();
    const evidence: LearningEvidence[] = mission.topicIds.map((topicId) => ({
      topicId,
      correct: true,
      hintCount: summary.hintCount,
      retryCount: summary.retryCount,
      occurredAt,
    }));
    update((current) => addMission(current, mission.id, mission.xp, evidence));
  }, [update]);

  const completePlaceValueLesson = useCallback((summary: LessonEvidenceSummary) => {
    const evidence = createPlaceValueEvidence(summary, new Date().toISOString());
    update((current) => {
      const next = addMission(current, 'mission_bundle_bridge', 40, evidence.slice(0, 2));
      return recordProgressEvidence(next, evidence.slice(2));
    });
  }, [update]);

  const completeEnglishWordLesson = useCallback((summary: EnglishWordLessonSummary) => {
    const occurredAt = new Date().toISOString();
    update((current) => addMission(
      current,
      ENGLISH_WORD_MISSION_ID,
      45,
      [createEnglishWordEvidence(summary, occurredAt)],
    ));
  }, [update]);

  const completeEnglishSpeakingLesson = useCallback((summary: EnglishSpeakingLessonSummary) => {
    update((current) => recordProgressEvidence(current, createEnglishSpeakingEvidence(summary, new Date().toISOString())));
  }, [update]);

  const completeEnglishCardLesson = useCallback((scenario: EnglishCourseScenario, summary: EnglishCardLessonSummary) => {
    update((current) => recordProgressEvidence(current, createEnglishCardEvidence(scenario, summary, new Date().toISOString())));
  }, [update]);

  const completeChineseZhuyinLesson = useCallback((summary: ChineseZhuyinLessonSummary) => {
    update((current) => recordProgressEvidence(current, [createChineseZhuyinEvidence(summary, new Date().toISOString())]));
  }, [update]);

  return useMemo(
    () => ({progress, setChildAlias, setCurriculumFramework, completeMission, completePlaceValueLesson, completeEnglishWordLesson, completeEnglishSpeakingLesson, completeEnglishCardLesson, completeChineseZhuyinLesson}),
    [progress, setChildAlias, setCurriculumFramework, completeMission, completePlaceValueLesson, completeEnglishWordLesson, completeEnglishSpeakingLesson, completeEnglishCardLesson, completeChineseZhuyinLesson],
  );
}
