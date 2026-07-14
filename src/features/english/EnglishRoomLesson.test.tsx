/** @vitest-environment happy-dom */

import {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {getEnglishScenarioForTopic} from './englishCourse';
import {EnglishRoomLesson} from './EnglishRoomLesson';

const scenario = getEnglishScenarioForTopic('tw_eng_g1_prepositions')!;
let root: Root | null = null;

function buttonWithText(text: string) {
  const expected = text.replace(/\s+/g, '');
  const button = [...document.querySelectorAll<HTMLButtonElement>('button')]
    .find((candidate) => candidate.textContent?.replace(/\s+/g, '') === expected);
  if (!button) throw new Error(`Missing button: ${text}`);
  return button;
}

async function click(text: string) {
  await act(async () => {
    buttonWithText(text).click();
    await Promise.resolve();
  });
}

beforeEach(async () => {
  document.body.replaceChildren();
  Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
  Object.assign(window, {scrollTo: () => undefined});
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
});

describe('EnglishRoomLesson', () => {
  it('keeps the visual scene and equivalent HTML controls on one state', async () => {
    await act(async () => root?.render(
      <EnglishRoomLesson scenario={scenario} onBack={() => undefined} onComplete={() => undefined} />,
    ));

    const controls = [...document.querySelectorAll<HTMLButtonElement>('button')];
    expect(controls.every((button) => Boolean(button.getAttribute('aria-label') || button.textContent?.trim()))).toBe(true);
    expect(document.querySelector('.room-simulator-stage')?.getAttribute('data-position')).toBe('next-to');
    expect(document.querySelector('.room-position-status strong')?.textContent).toBe('The bag is next to the chair.');

    await click('UNDER 椅子下面');
    expect(document.querySelector('.room-simulator-stage')?.getAttribute('data-position')).toBe('under');
    expect(buttonWithText('UNDER 椅子下面').getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('.room-position-status strong')?.textContent).toBe('The bag is under the chair.');

    await act(async () => {
      document.querySelector<HTMLButtonElement>('[aria-label="把書包重設到椅子旁邊"]')?.click();
      await Promise.resolve();
    });
    expect(document.querySelector('.room-simulator-stage')?.getAttribute('data-position')).toBe('next-to');
  });

  it('reports evidence once only after both position checks and the exact sentence', async () => {
    const onComplete = vi.fn();
    await act(async () => root?.render(
      <EnglishRoomLesson scenario={scenario} onBack={() => undefined} onComplete={onComplete} />,
    ));

    await click('檢查位置');
    const feedback = document.querySelector('.english-lesson-feedback [role="status"]');
    expect(feedback?.getAttribute('aria-live')).toBe('polite');
    expect(feedback?.getAttribute('aria-atomic')).toBe('true');
    expect(feedback?.textContent).toContain('UNDER 是椅子下面');
    await click('給我提示');
    expect(onComplete).not.toHaveBeenCalled();

    await click('UNDER 椅子下面');
    await click('檢查位置');
    await click('ON 椅子上面');
    await click('檢查位置');
    expect(onComplete).not.toHaveBeenCalled();

    await click('on');
    for (const token of scenario.tokens) await click(token);
    expect(onComplete).not.toHaveBeenCalled();

    await click('我說完了');
    await click('聽一次，再說');
    await act(async () => {
      const finish = buttonWithText('第二次說完了');
      finish.click();
      finish.click();
      await Promise.resolve();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({hintCount: 1, retryCount: 2});
  });
});
