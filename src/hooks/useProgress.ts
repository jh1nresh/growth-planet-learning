import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {completeMission as addMission, loadProgress, recordProgressEvidence, sanitizeAlias, saveProgress, setCurriculumFramework as selectCurriculumFramework} from '../lib/progress';
import type {LessonEvidenceSummary} from '../features/lessons/PlaceValueLesson';
import {createPlaceValueEvidence} from '../features/lessons/placeValueEvidence';
import {createEnglishWordEvidence, ENGLISH_WORD_MISSION_ID, type EnglishWordLessonSummary} from '../features/english/englishWordLessonState';
import {createChineseZhuyinEvidence, type ChineseZhuyinLessonSummary} from '../features/chinese/chineseZhuyinLessonState';
import type {CurriculumFrameworkSlug, LearningEvidence, Mission, ProgressState} from '../types';
import {FamilyApiError} from '../features/family/familyApi';
import type {ProgressEnvelope, ProgressSyncStatus} from '../features/family/familyTypes';

const SYNC_META_PREFIX = 'growth-planet:sync:v1:';

interface SyncMeta {
  revision: number | null;
  dirty: boolean;
}

export interface ProgressSyncAdapter {
  load: () => Promise<ProgressEnvelope>;
  save: (progress: ProgressState, revision: number) => Promise<ProgressEnvelope>;
}

function loadSyncMeta(namespace: string): SyncMeta {
  try {
    const stored = window.localStorage.getItem(`${SYNC_META_PREFIX}${namespace}`);
    if (!stored) return {revision: null, dirty: false};
    const value = JSON.parse(stored) as Partial<SyncMeta>;
    return {
      revision: Number.isInteger(value.revision) && (value.revision ?? 0) > 0 ? value.revision as number : null,
      dirty: value.dirty === true,
    };
  } catch {
    return {revision: null, dirty: false};
  }
}

function saveSyncMeta(namespace: string, meta: SyncMeta) {
  window.localStorage.setItem(`${SYNC_META_PREFIX}${namespace}`, JSON.stringify(meta));
}

function canonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, entry]) => [key, canonicalJson(entry)]),
  );
}

export function progressStatesEqual(left: ProgressState, right: ProgressState) {
  return JSON.stringify(canonicalJson(left)) === JSON.stringify(canonicalJson(right));
}

export function useProgress(namespace: string, sync: ProgressSyncAdapter | null = null) {
  const initialProgress = useMemo(() => loadProgress(window.localStorage, namespace), []);
  const [progress, setProgress] = useState<ProgressState>(initialProgress);
  const [syncStatus, setSyncStatus] = useState<ProgressSyncStatus>(sync ? 'loading' : 'local');
  const progressRef = useRef(initialProgress);
  const revisionRef = useRef<number | null>(null);
  const namespaceRef = useRef(namespace);
  const syncRef = useRef(sync);
  const hydrationRef = useRef<Promise<void>>(Promise.resolve());
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const mutationIdRef = useRef(0);
  const conflictRef = useRef(false);

  const markConflict = useCallback(() => {
    conflictRef.current = true;
    setSyncStatus('conflict');
  }, []);

  const applyRemote = useCallback((envelope: ProgressEnvelope) => {
    if (namespaceRef.current !== namespace || syncRef.current !== sync) return;
    progressRef.current = envelope.progress;
    revisionRef.current = envelope.revision;
    conflictRef.current = false;
    saveProgress(window.localStorage, namespace, envelope.progress);
    saveSyncMeta(namespace, {revision: envelope.revision, dirty: false});
    setProgress(envelope.progress);
    setSyncStatus('synced');
  }, [namespace, sync]);

  useLayoutEffect(() => {
    namespaceRef.current = namespace;
    syncRef.current = sync;
    mutationIdRef.current = 0;
    conflictRef.current = false;
    const local = loadProgress(window.localStorage, namespace);
    const meta = loadSyncMeta(namespace);
    progressRef.current = local;
    revisionRef.current = meta.revision;
    setProgress(local);
    saveQueueRef.current = Promise.resolve();

    if (!sync) {
      setSyncStatus('local');
      hydrationRef.current = Promise.resolve();
      return;
    }

    const startedMutationId = mutationIdRef.current;
    setSyncStatus('loading');
    const hydrate = async () => {
      let remote: ProgressEnvelope | undefined;
      try {
        remote = await sync.load();
        if (namespaceRef.current !== namespace || syncRef.current !== sync) return;

        if (meta.dirty) {
          if (meta.revision !== remote.revision) {
            if (!progressStatesEqual(local, remote.progress)) {
              markConflict();
              return;
            }
            revisionRef.current = remote.revision;
            const unchanged = mutationIdRef.current === startedMutationId;
            if (unchanged) {
              progressRef.current = remote.progress;
              saveProgress(window.localStorage, namespace, remote.progress);
              setProgress(remote.progress);
            }
            saveSyncMeta(namespace, {revision: remote.revision, dirty: !unchanged});
            setSyncStatus(unchanged ? 'synced' : 'loading');
            return;
          }
          const saved = await sync.save(local, remote.revision);
          if (namespaceRef.current !== namespace || syncRef.current !== sync) return;
          revisionRef.current = saved.revision;
          const unchanged = mutationIdRef.current === startedMutationId;
          if (unchanged) {
            progressRef.current = saved.progress;
            saveProgress(window.localStorage, namespace, saved.progress);
            setProgress(saved.progress);
          }
          saveSyncMeta(namespace, {revision: saved.revision, dirty: !unchanged});
          setSyncStatus(unchanged ? 'synced' : 'loading');
        } else {
          revisionRef.current = remote.revision;
          const unchanged = mutationIdRef.current === startedMutationId;
          if (unchanged) {
            progressRef.current = remote.progress;
            saveProgress(window.localStorage, namespace, remote.progress);
            setProgress(remote.progress);
          }
          saveSyncMeta(namespace, {revision: remote.revision, dirty: !unchanged});
          setSyncStatus(unchanged ? 'synced' : 'loading');
        }
      } catch (caught) {
        if (namespaceRef.current !== namespace || syncRef.current !== sync) return;
        if (caught instanceof FamilyApiError && caught.code === 'progress_conflict') markConflict();
        else setSyncStatus('offline');
      }
    };
    hydrationRef.current = hydrate();
  }, [markConflict, namespace, sync]);

  const update = useCallback((reduce: (current: ProgressState) => ProgressState) => {
    const mutationId = ++mutationIdRef.current;
    const next = reduce(progressRef.current);
    progressRef.current = next;
    setProgress(next);
    saveProgress(window.localStorage, namespace, next);
    if (!sync) {
      setSyncStatus('local');
      return;
    }

    const meta = loadSyncMeta(namespace);
    saveSyncMeta(namespace, {revision: revisionRef.current ?? meta.revision, dirty: true});
    if (conflictRef.current) {
      setSyncStatus('conflict');
      return;
    }
    setSyncStatus('loading');
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(() => hydrationRef.current)
      .then(async () => {
        if (namespaceRef.current !== namespace || syncRef.current !== sync || conflictRef.current) return;
        const revision = revisionRef.current;
        if (!revision) throw new FamilyApiError(503, 'sync_not_ready', '目前離線，稍後會再同步。');
        const saved = await sync.save(next, revision);
        if (namespaceRef.current !== namespace || syncRef.current !== sync) return;
        revisionRef.current = saved.revision;
        const isLatestMutation = mutationIdRef.current === mutationId;
        if (isLatestMutation) {
          progressRef.current = saved.progress;
          saveProgress(window.localStorage, namespace, saved.progress);
          setProgress(saved.progress);
        }
        saveSyncMeta(namespace, {revision: saved.revision, dirty: !isLatestMutation});
        setSyncStatus(isLatestMutation ? 'synced' : 'loading');
      })
      .catch((caught) => {
        if (namespaceRef.current !== namespace || syncRef.current !== sync) return;
        const latest = loadSyncMeta(namespace);
        saveSyncMeta(namespace, {revision: revisionRef.current ?? latest.revision, dirty: true});
        if (caught instanceof FamilyApiError && caught.code === 'progress_conflict') markConflict();
        else setSyncStatus('offline');
      });
  }, [markConflict, namespace, sync]);

  const retrySync = useCallback(async () => {
    if (!sync || namespaceRef.current !== namespace || syncRef.current !== sync || conflictRef.current) return;
    setSyncStatus('loading');
    const task = saveQueueRef.current.catch(() => undefined).then(async () => {
      try {
        const local = progressRef.current;
        const startedMutationId = mutationIdRef.current;
        const remote = await sync.load();
        if (namespaceRef.current !== namespace || syncRef.current !== sync) return;
        const meta = loadSyncMeta(namespace);
        if (!meta.dirty) {
          applyRemote(remote);
          return;
        }
        if (meta.revision !== remote.revision) {
          if (!progressStatesEqual(local, remote.progress)) {
            markConflict();
            return;
          }
          revisionRef.current = remote.revision;
          const unchanged = mutationIdRef.current === startedMutationId;
          if (unchanged) {
            progressRef.current = remote.progress;
            saveProgress(window.localStorage, namespace, remote.progress);
            setProgress(remote.progress);
          }
          saveSyncMeta(namespace, {revision: remote.revision, dirty: !unchanged});
          setSyncStatus(unchanged ? 'synced' : 'loading');
          return;
        }
        const saved = await sync.save(local, remote.revision);
        if (namespaceRef.current !== namespace || syncRef.current !== sync) return;
        revisionRef.current = saved.revision;
        const unchanged = mutationIdRef.current === startedMutationId;
        if (unchanged) {
          progressRef.current = saved.progress;
          saveProgress(window.localStorage, namespace, saved.progress);
          setProgress(saved.progress);
        }
        saveSyncMeta(namespace, {revision: saved.revision, dirty: !unchanged});
        setSyncStatus(unchanged ? 'synced' : 'loading');
      } catch (caught) {
        if (namespaceRef.current !== namespace || syncRef.current !== sync) return;
        if (caught instanceof FamilyApiError && caught.code === 'progress_conflict') markConflict();
        else setSyncStatus('offline');
      }
    });
    saveQueueRef.current = task;
    await task;
  }, [applyRemote, markConflict, namespace, sync]);

  const resolveSyncConflict = useCallback(async (strategy: 'cloud' | 'local') => {
    if (!sync || namespaceRef.current !== namespace || syncRef.current !== sync || !conflictRef.current) return;
    setSyncStatus('loading');
    try {
      const remote = await sync.load();
      if (namespaceRef.current !== namespace || syncRef.current !== sync) return;
      if (strategy === 'cloud') {
        applyRemote(remote);
        return;
      }
      applyRemote(await sync.save(progressRef.current, remote.revision));
    } catch {
      if (namespaceRef.current !== namespace || syncRef.current !== sync) return;
      markConflict();
    }
  }, [applyRemote, markConflict, namespace, sync]);

  useEffect(() => {
    if (!sync) return;
    const retry = () => void retrySync();
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [retrySync, sync]);

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
      const withMission = addMission(current, 'mission_bundle_bridge', 40, evidence.slice(0, 2));
      return recordProgressEvidence(withMission, evidence.slice(2));
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

  const completeChineseZhuyinLesson = useCallback((summary: ChineseZhuyinLessonSummary) => {
    update((current) => recordProgressEvidence(current, [createChineseZhuyinEvidence(summary, new Date().toISOString())]));
  }, [update]);

  return useMemo(
    () => ({progress, syncStatus, retrySync, resolveSyncConflict, setChildAlias, setCurriculumFramework, completeMission, completePlaceValueLesson, completeEnglishWordLesson, completeChineseZhuyinLesson}),
    [progress, syncStatus, retrySync, resolveSyncConflict, setChildAlias, setCurriculumFramework, completeMission, completePlaceValueLesson, completeEnglishWordLesson, completeChineseZhuyinLesson],
  );
}
