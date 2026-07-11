import {useCallback, useEffect, useMemo, useState} from 'react';
import {completeMission as addMission, loadProgress, sanitizeAlias, saveProgress} from '../lib/progress';
import type {Mission, ProgressState} from '../types';

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

  const completeMission = useCallback((mission: Mission) => {
    update(addMission(progress, mission.id, mission.xp));
  }, [progress, update]);

  return useMemo(() => ({progress, setChildAlias, completeMission}), [progress, setChildAlias, completeMission]);
}
