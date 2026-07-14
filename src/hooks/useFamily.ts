import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {AuthState} from '../features/auth/auth-context';
import {createFamilyApi} from '../features/family/familyApi';
import type {ChildAvatarId, ChildProfile, FamilySnapshot} from '../features/family/familyTypes';

const PROGRESS_CACHE_PREFIX = 'growth-planet:progress:v1:child:';
const SYNC_CACHE_PREFIX = 'growth-planet:sync:v1:child:';

function clearChildCache(childId: string) {
  window.localStorage.removeItem(`${PROGRESS_CACHE_PREFIX}${childId}`);
  window.localStorage.removeItem(`${SYNC_CACHE_PREFIX}${childId}`);
}

export function pruneDeletedChildCaches(storage: Storage, profiles: ChildProfile[]) {
  const currentIds = new Set(profiles.map((profile) => profile.id));
  const keys = Array.from({length: storage.length}, (_, index) => storage.key(index)).filter((key): key is string => Boolean(key));
  for (const key of keys) {
    const prefix = [PROGRESS_CACHE_PREFIX, SYNC_CACHE_PREFIX].find((candidate) => key.startsWith(candidate));
    if (prefix && !currentIds.has(key.slice(prefix.length))) storage.removeItem(key);
  }
}

export function useFamily(auth: AuthState) {
  const api = useMemo(() => createFamilyApi(auth.getAccessToken), [auth.getAccessToken]);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const profilesRef = useRef<ChildProfile[]>([]);
  const activeChildIdRef = useRef<string | null>(null);

  const commitSnapshot = useCallback((snapshot: FamilySnapshot) => {
    profilesRef.current = snapshot.profiles;
    activeChildIdRef.current = snapshot.activeChildId;
    setProfiles(snapshot.profiles);
    setActiveChildId(snapshot.activeChildId);
  }, []);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const snapshot = auth.authenticated ? await api.loadFamily() : await api.loadDevice();
      if (currentRequest !== requestId.current) return;
      pruneDeletedChildCaches(window.localStorage, snapshot.profiles);
      commitSnapshot(snapshot);
    } catch (caught) {
      if (currentRequest !== requestId.current) return;
      if (auth.authenticated) setError(caught instanceof Error ? caught.message : '家庭資料服務暫時無法使用。');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [api, auth.authenticated, commitSnapshot]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const retry = () => void refresh();
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [refresh]);

  const run = useCallback(async <T,>(operation: () => Promise<T>) => {
    setError(null);
    try {
      return await operation();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '家庭資料服務暫時無法使用。';
      setError(message);
      throw caught;
    }
  }, []);

  const createChild = useCallback((input: {alias: string; avatarId: ChildAvatarId; pin: string}) => run(async () => {
    const profile = await api.createChild(input);
    commitSnapshot({profiles: [...profilesRef.current, profile], activeChildId: activeChildIdRef.current});
    return profile;
  }), [api, commitSnapshot, run]);

  const updateChild = useCallback((input: {childId: string; alias: string; avatarId: ChildAvatarId; pin?: string}) => run(async () => {
    const profile = await api.updateChild(input);
    commitSnapshot({
      profiles: profilesRef.current.map((candidate) => candidate.id === profile.id ? profile : candidate),
      activeChildId: input.pin && activeChildIdRef.current === profile.id ? null : activeChildIdRef.current,
    });
    return profile;
  }), [api, commitSnapshot, run]);

  const deleteChild = useCallback((childId: string) => run(async () => {
    await api.deleteChild(childId);
    clearChildCache(childId);
    commitSnapshot({
      profiles: profilesRef.current.filter((profile) => profile.id !== childId),
      activeChildId: activeChildIdRef.current === childId ? null : activeChildIdRef.current,
    });
  }), [api, commitSnapshot, run]);

  const unlockChild = useCallback((childId: string, pin: string) => run(async () => {
    const profile = await api.unlockChild(childId, pin);
    const nextProfiles = profilesRef.current.some((candidate) => candidate.id === profile.id)
      ? profilesRef.current
      : [...profilesRef.current, profile];
    commitSnapshot({profiles: nextProfiles, activeChildId: profile.id});
    return profile;
  }), [api, commitSnapshot, run]);

  const endChildSession = useCallback(() => run(async () => {
    await api.endChildSession();
    commitSnapshot({profiles: profilesRef.current, activeChildId: null});
  }), [api, commitSnapshot, run]);

  const activeChild = profiles.find((profile) => profile.id === activeChildId) ?? null;
  const progressSync = useMemo(() => activeChildId ? {
    load: () => api.loadProgress(activeChildId),
    save: (progress: Parameters<typeof api.saveProgress>[1], revision: number) => api.saveProgress(activeChildId, progress, revision),
  } : null, [activeChildId, api]);

  return {
    profiles,
    activeChild,
    loading,
    error,
    clearError: () => setError(null),
    refresh,
    createChild,
    updateChild,
    deleteChild,
    unlockChild,
    endChildSession,
    progressSync,
  };
}
