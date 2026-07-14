import {describe, expect, it} from 'vitest';
import {englishCourseScenarios} from './englishCourse';
import {
  beginEnglishCardRepeat,
  createEnglishCardEvidence,
  finishEnglishCardRepeat,
  finishEnglishCardTurn,
  initialEnglishCardLessonState,
  markEnglishCardModelHeard,
  requestEnglishCardHint,
  selectEnglishCardIntent,
  selectEnglishCardToken,
} from './englishCardLessonState';

const apples = englishCourseScenarios.find((scenario) => scenario.id === 'english_life_03_apples')!;

describe('English scenario card lesson', () => {
  it('requires the model and correct intent before sentence assembly', () => {
    const initial = initialEnglishCardLessonState();
    expect(selectEnglishCardIntent(initial, apples, apples.correctIntent)).toBe(initial);

    let state = markEnglishCardModelHeard(initial);
    state = selectEnglishCardIntent(state, apples, '蘋果的位置');
    expect(state).toMatchObject({step: 'intent', retryCount: 1, highlightedChoice: apples.correctIntent});

    state = selectEnglishCardIntent(state, apples, apples.correctIntent);
    expect(state).toMatchObject({step: 'assemble', highlightedChoice: null});
  });

  it('accepts sentence tokens only in the configured order', () => {
    expect(apples.tileChoices).not.toEqual([...apples.tokens, ...apples.distractors]);
    let state = selectEnglishCardIntent(markEnglishCardModelHeard(initialEnglishCardLessonState()), apples, apples.correctIntent);
    state = selectEnglishCardToken(state, apples, 'like');
    expect(state).toMatchObject({step: 'assemble', retryCount: 1, highlightedChoice: 'I'});

    for (const token of apples.tokens) state = selectEnglishCardToken(state, apples, token);
    expect(state).toMatchObject({step: 'speak', placedTokens: apples.tokens});
  });

  it('counts hints only while a choice can be made', () => {
    const intent = markEnglishCardModelHeard(initialEnglishCardLessonState());
    const hintedIntent = requestEnglishCardHint(intent, apples);
    expect(hintedIntent).toMatchObject({hintCount: 1, highlightedChoice: apples.correctIntent});

    const assemble = selectEnglishCardIntent(hintedIntent, apples, apples.correctIntent);
    const hintedToken = requestEnglishCardHint(assemble, apples);
    expect(hintedToken).toMatchObject({hintCount: 2, highlightedChoice: 'I'});
  });

  it('waits for an explicit speaking turn, review, and repeat', () => {
    let state = selectEnglishCardIntent(markEnglishCardModelHeard(initialEnglishCardLessonState()), apples, apples.correctIntent);
    for (const token of apples.tokens) state = selectEnglishCardToken(state, apples, token);
    state = finishEnglishCardTurn(state);
    expect(state.step).toBe('review');
    state = beginEnglishCardRepeat(state);
    expect(state.step).toBe('repeat');
    state = finishEnglishCardRepeat(state);
    expect(state.step).toBe('complete');
  });

  it('creates evidence only for the scenario topics and makes no audio claim', () => {
    expect(createEnglishCardEvidence(apples, {hintCount: 1, retryCount: 2}, '2026-07-14T00:00:00.000Z')).toEqual([
      {
        topicId: 'tw_eng_g1_nouns_verbs',
        correct: true,
        hintCount: 1,
        retryCount: 2,
        occurredAt: '2026-07-14T00:00:00.000Z',
      },
    ]);
  });
});
