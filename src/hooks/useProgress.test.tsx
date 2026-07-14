/** @vitest-environment happy-dom */

import {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {emptyProgress, loadProgress, saveProgress} from '../lib/progress';
import type {ProgressEnvelope} from '../features/family/familyTypes';
import type {ProgressState} from '../types';
import {useProgress, type ProgressSyncAdapter} from './useProgress';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => { resolve = next; });
  return {promise, resolve};
}

function progressFixture(alias: string, xp: number) {
  return {...emptyProgress(), childAlias: alias, xp, updatedAt: `2026-07-13T00:00:${String(xp).padStart(2, '0')}.000Z`};
}

function reorderedLikePostgres(progress: ProgressState): ProgressState {
  return {
    updatedAt: progress.updatedAt,
    xp: progress.xp,
    topicStates: progress.topicStates.map((state) => ({
      lastPracticedAt: state.lastPracticedAt,
      retryCount: state.retryCount,
      hintCount: state.hintCount,
      correctAttempts: state.correctAttempts,
      attempts: state.attempts,
      mastery: state.mastery,
      topicId: state.topicId,
    })),
    completedMissionIds: [...progress.completedMissionIds],
    curriculumFramework: progress.curriculumFramework,
    childAlias: progress.childAlias,
    version: progress.version,
  };
}

type HookResult = ReturnType<typeof useProgress>;

let root: Root | null = null;
let current: HookResult | null = null;

function Probe({namespace, sync}: {namespace: string; sync: ProgressSyncAdapter | null}) {
  current = useProgress(namespace, sync);
  return null;
}

async function renderProbe(namespace: string, sync: ProgressSyncAdapter | null) {
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(<Probe namespace={namespace} sync={sync} />);
    await Promise.resolve();
  });
}

async function rerenderProbe(namespace: string, sync: ProgressSyncAdapter | null) {
  await act(async () => {
    root?.render(<Probe namespace={namespace} sync={sync} />);
    await Promise.resolve();
  });
}

beforeEach(() => {
  window.localStorage.clear();
  document.body.replaceChildren();
  current = null;
  Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  window.localStorage.clear();
});

describe('cloud progress synchronization', () => {
  it('blocks dirty revision conflicts until cloud resolution explicitly loads the newest snapshot', async () => {
    const namespace = 'child:550e8400-e29b-41d4-a716-446655440000';
    const local = progressFixture('本機', 10);
    const remoteAtConflict = progressFixture('雲端二', 20);
    const latestRemote = progressFixture('雲端三', 30);
    saveProgress(window.localStorage, namespace, local);
    window.localStorage.setItem(`growth-planet:sync:v1:${namespace}`, JSON.stringify({revision: 1, dirty: true}));
    const load = vi.fn()
      .mockResolvedValueOnce({progress: remoteAtConflict, revision: 2})
      .mockResolvedValueOnce({progress: latestRemote, revision: 3});
    const save = vi.fn();

    await renderProbe(namespace, {load, save});

    expect(current?.syncStatus).toBe('conflict');
    expect(current?.progress).toEqual(local);
    expect(save).not.toHaveBeenCalled();

    act(() => current?.setChildAlias('衝突中的本機更新'));
    expect(save).not.toHaveBeenCalled();
    expect(current?.syncStatus).toBe('conflict');

    await act(async () => current?.resolveSyncConflict('cloud'));

    expect(load).toHaveBeenCalledTimes(2);
    expect(current?.progress).toEqual(latestRemote);
    expect(current?.syncStatus).toBe('synced');
    expect(loadProgress(window.localStorage, namespace)).toEqual(latestRemote);
  });

  it('uploads the latest local state only after explicit local conflict resolution', async () => {
    const namespace = 'child:550e8400-e29b-41d4-a716-446655440000';
    const local = progressFixture('本機', 10);
    const remoteAtConflict = progressFixture('雲端二', 20);
    const latestRemote = progressFixture('雲端三', 30);
    saveProgress(window.localStorage, namespace, local);
    window.localStorage.setItem(`growth-planet:sync:v1:${namespace}`, JSON.stringify({revision: 1, dirty: true}));
    const load = vi.fn()
      .mockResolvedValueOnce({progress: remoteAtConflict, revision: 2})
      .mockResolvedValueOnce({progress: latestRemote, revision: 3});
    const save = vi.fn(async (progress, revision) => ({progress, revision: revision + 1}));

    await renderProbe(namespace, {load, save});
    act(() => current?.setChildAlias('保留這台'));
    expect(save).not.toHaveBeenCalled();

    await act(async () => current?.resolveSyncConflict('local'));

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({childAlias: '保留這台'}), 3);
    expect(current?.syncStatus).toBe('synced');
    expect(JSON.parse(window.localStorage.getItem(`growth-planet:sync:v1:${namespace}`) ?? '{}')).toEqual({revision: 4, dirty: false});
  });

  it('keeps child B isolated from a late child A save and reconciles A without a false conflict', async () => {
    const namespaceA = 'child:550e8400-e29b-41d4-a716-446655440000';
    const namespaceB = 'child:a8098c1a-f86e-41da-bd1d-4c7f4e8ab9c1';
    const initialA = progressFixture('孩子 A', 10);
    const remoteB = progressFixture('孩子 B', 20);
    const pendingSave = deferred<ProgressEnvelope>();
    const saveA = vi.fn((_progress: ProgressState, _revision: number) => pendingSave.promise);
    const adapterA: ProgressSyncAdapter = {
      load: vi.fn(async () => ({progress: initialA, revision: 1})),
      save: saveA,
    };

    await renderProbe(namespaceA, adapterA);
    act(() => current?.setChildAlias('孩子 A 新進度'));
    await act(async () => { await Promise.resolve(); });
    expect(saveA).toHaveBeenCalledTimes(1);
    const savedA = saveA.mock.calls[0]?.[0];
    expect(savedA).toBeDefined();
    if (!savedA) throw new Error('child A save did not capture progress');

    const adapterB: ProgressSyncAdapter = {
      load: vi.fn(async () => ({progress: remoteB, revision: 1})),
      save: vi.fn(),
    };
    await rerenderProbe(namespaceB, adapterB);
    expect(current?.progress).toEqual(remoteB);
    expect(current?.syncStatus).toBe('synced');

    await act(async () => pendingSave.resolve({progress: savedA, revision: 2}));
    expect(current?.progress).toEqual(remoteB);
    expect(adapterB.save).not.toHaveBeenCalled();
    expect(loadProgress(window.localStorage, namespaceB)).toEqual(remoteB);

    const returnedAdapterA: ProgressSyncAdapter = {
      load: vi.fn(async () => ({progress: reorderedLikePostgres(savedA), revision: 2})),
      save: vi.fn(),
    };
    await rerenderProbe(namespaceA, returnedAdapterA);

    expect(current?.progress).toEqual(savedA);
    expect(current?.syncStatus).toBe('synced');
    expect(returnedAdapterA.save).not.toHaveBeenCalled();
  });
});
