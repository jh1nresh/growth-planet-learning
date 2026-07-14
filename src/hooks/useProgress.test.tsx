/** @vitest-environment happy-dom */

import {StrictMode, useLayoutEffect, useRef} from 'react';
import {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {emptyProgress, loadProgress, saveProgress} from '../lib/progress';
import type {ProgressState} from '../types';
import {useProgress} from './useProgress';

let root: Root | null = null;
let renderedProgress: ProgressState | null = null;

function ProgressProbe({namespace, completionCount}: {namespace: string; completionCount: number}) {
  const {progress, completeEnglishSpeakingLesson} = useProgress(namespace);
  const completedNamespaces = useRef(new Map<string, number>());
  renderedProgress = progress;

  useLayoutEffect(() => {
    const completedCount = completedNamespaces.current.get(namespace) ?? 0;
    if (completedCount >= completionCount) return;
    completedNamespaces.current.set(namespace, completionCount);
    for (let index = completedCount; index < completionCount; index += 1) {
      completeEnglishSpeakingLesson({hintCount: 0, retryCount: 0});
    }
  }, [completeEnglishSpeakingLesson, completionCount, namespace]);

  return null;
}

async function renderProbe(namespace: string, completionCount: number) {
  await act(async () => {
    root?.render(
      <StrictMode>
        <ProgressProbe namespace={namespace} completionCount={completionCount} />
      </StrictMode>,
    );
    await Promise.resolve();
  });
}

beforeEach(() => {
  window.localStorage.clear();
  document.body.replaceChildren();
  renderedProgress = null;
  Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  window.localStorage.clear();
});

describe('useProgress namespace transitions', () => {
  it('keeps A, B, and guest progress isolated through account switches', async () => {
    const accountA = {...emptyProgress(), childAlias: '孩子 A', xp: 10};
    const accountB = {...emptyProgress(), childAlias: '孩子 B', xp: 40};
    saveProgress(window.localStorage, 'privy:user-a', accountA);
    saveProgress(window.localStorage, 'privy:user-b', accountB);
    const accountABeforeSwitch = window.localStorage.getItem('growth-planet:progress:v1:privy:user-a');

    await renderProbe('privy:user-a', 0);
    await renderProbe('privy:user-b', 1);

    const storedB = loadProgress(window.localStorage, 'privy:user-b');
    expect(storedB).toMatchObject({childAlias: '孩子 B', xp: 40});
    expect(storedB.topicStates.find((state) => state.topicId === 'tw_eng_g1_greetings')?.attempts).toBe(1);

    await renderProbe('privy:user-a', 0);
    expect(renderedProgress).toMatchObject({childAlias: '孩子 A', xp: 10});
    expect((renderedProgress as ProgressState).topicStates.find((state) => state.topicId === 'tw_eng_g1_greetings')?.attempts).toBe(0);

    await renderProbe('guest', 1);
    const storedGuest = loadProgress(window.localStorage, 'guest');
    expect(storedGuest).toMatchObject({childAlias: '', xp: 0});
    expect(storedGuest.topicStates.find((state) => state.topicId === 'tw_eng_g1_greetings')?.attempts).toBe(1);

    await renderProbe('privy:user-b', 1);
    expect(renderedProgress).toMatchObject({childAlias: '孩子 B', xp: 40});
    expect((renderedProgress as ProgressState).topicStates.find((state) => state.topicId === 'tw_eng_g1_greetings')?.attempts).toBe(1);
    expect(window.localStorage.getItem('growth-planet:progress:v1:privy:user-a')).toBe(accountABeforeSwitch);
  });

  it('composes synchronous progress updates without losing evidence', async () => {
    await renderProbe('guest', 2);

    const storedGuest = loadProgress(window.localStorage, 'guest');
    expect(storedGuest.topicStates.find((state) => state.topicId === 'tw_eng_g1_greetings')?.attempts).toBe(2);
    expect(storedGuest.topicStates.find((state) => state.topicId === 'tw_eng_g1_sight_words')?.attempts).toBe(2);
  });
});
