import {useCallback, useEffect, useMemo, useState} from 'react';
import {completeMission as addMission, loadProgress, recordProgressEvidence, sanitizeAlias, saveProgress, setCurriculumFramework as selectCurriculumFramework} from '../lib/progress';
import type {LessonEvidenceSummary} from '../features/lessons/PlaceValueLesson';
import {createPlaceValueEvidence} from '../features/lessons/placeValueEvidence';
import {createEnglishWordEvidence, ENGLISH_WORD_MISSION_ID, type EnglishWordLessonSummary} from '../features/english/englishWordLessonState';
import {createChineseZhuyinEvidence, type ChineseZhuyinLessonSummary} from '../features/chinese/chineseZhuyinLessonState';
import type {CurriculumFrameworkSlug, LearningEvidence, Mission, ProgressState} from '../types';

export function useProgress(namespace: string) {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress(window.localStorage, namespace));

  useEffect(() => {
    setProgress(loadProgress(window.localStorage, namespace));
  }, [namespace]);

  const update = useCallback((next: ProgressState) => {
    setProgress(next);
    saveProgress(window.localStorage, namespace, next);
  }, [namespace]);

  const setChildAlias = useCallback((alias: string) => {
    update({...progress, childAlias: sanitizeAlias(alias), updatedAt: new Date().toISOString()});
  }, [progress, update]);

  const setCurriculumFramework = useCallback((curriculumFramework: CurriculumFrameworkSlug) => {
    update(selectCurriculumFramework(progress, curriculumFramework));
  }, [progress, update]);

  const completeMission = useCallback((mission: Mission, summary: LessonEvidenceSummary) => {
    const occurredAt = new Date().toISOString();
    const evidence: LearningEvidence[] = mission.topicIds.map((topicId) => ({
      topicId,
      correct: true,
      hintCount: summary.hintCount,
      retryCount: summary.retryCount,
      occurredAt,
    }));
    update(addMission(progress, mission.id, mission.xp, evidence));
  }, [progress, update]);

  const completePlaceValueLesson = useCallback((summary: LessonEvidenceSummary) => {
    const evidence = createPlaceValueEvidence(summary, new Date().toISOString());
    let next = addMission(progress, 'mission_bundle_bridge', 40, evidence.slice(0, 2));
    next = recordProgressEvidence(next, evidence.slice(2));
    update(next);
  }, [progress, update]);

  const completeEnglishWordLesson = useCallback((summary: EnglishWordLessonSummary) => {
    const occurredAt = new Date().toISOString();
    update(addMission(
      progress,
      ENGLISH_WORD_MISSION_ID,
      45,
      [createEnglishWordEvidence(summary, occurredAt)],
    ));
  }, [progress, update]);

  const completeChineseZhuyinLesson = useCallback((summary: ChineseZhuyinLessonSummary) => {
    update(recordProgressEvidence(progress, [createChineseZhuyinEvidence(summary, new Date().toISOString())]));
  }, [progress, update]);

  return useMemo(
    () => ({progress, setChildAlias, setCurriculumFramework, completeMission, completePlaceValueLesson, completeEnglishWordLesson, completeChineseZhuyinLesson}),
    [progress, setChildAlias, setCurriculumFramework, completeMission, completePlaceValueLesson, completeEnglishWordLesson, completeChineseZhuyinLesson],
  );
}
