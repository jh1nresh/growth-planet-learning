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

function ProgressProbe({namespace, completeOnLayout}: {namespace: string; completeOnLayout: boolean}) {
  const {progress, completeEnglishSpeakingLesson} = useProgress(namespace);
  const completedNamespaces = useRef(new Set<string>());
  renderedProgress = progress;

  useLayoutEffect(() => {
    if (!completeOnLayout || completedNamespaces.current.has(namespace)) return;
    completedNamespaces.current.add(namespace);
    completeEnglishSpeakingLesson({hintCount: 0, retryCount: 0});
  }, [completeEnglishSpeakingLesson, completeOnLayout, namespace]);

  return null;
}

async function renderProbe(namespace: string, completeOnLayout: boolean) {
  await act(async () => {
    root?.render(
      <StrictMode>
        <ProgressProbe namespace={namespace} completeOnLayout={completeOnLayout} />
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
  it('uses the destination Privy account when completion runs before passive reconciliation', async () => {
    const accountA = {...emptyProgress(), childAlias: '孩子 A', xp: 10};
    const accountB = {...emptyProgress(), childAlias: '孩子 B', xp: 40};
    saveProgress(window.localStorage, 'privy:user-a', accountA);
    saveProgress(window.localStorage, 'privy:user-b', accountB);
    const accountABeforeSwitch = window.localStorage.getItem('growth-planet:progress:v1:privy:user-a');

    await renderProbe('privy:user-a', false);
    await renderProbe('privy:user-b', true);

    const finalProgress = renderedProgress as ProgressState | null;
    const storedB = loadProgress(window.localStorage, 'privy:user-b');
    expect(finalProgress).toMatchObject({childAlias: '孩子 B', xp: 40});
    expect(finalProgress?.topicStates.find((state) => state.topicId === 'tw_eng_g1_greetings')?.attempts).toBe(1);
    expect(storedB).toMatchObject({childAlias: '孩子 B', xp: 40});
    expect(storedB.topicStates.find((state) => state.topicId === 'tw_eng_g1_greetings')?.attempts).toBe(1);
    expect(window.localStorage.getItem('growth-planet:progress:v1:privy:user-a')).toBe(accountABeforeSwitch);
  });
});
