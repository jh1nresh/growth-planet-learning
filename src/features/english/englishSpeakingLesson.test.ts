import {describe, expect, it} from 'vitest';
import {
  beginEnglishSpeakingRepeat,
  createEnglishSpeakingEvidence,
  finishEnglishSpeakingRepeat,
  finishEnglishSpeakingTurn,
  initialEnglishSpeakingLessonState,
  markEnglishSpeakingModelHeard,
  requestEnglishSpeakingHint,
  selectEnglishSpeakingChoice,
} from './englishSpeakingLessonState';

describe('English speaking lesson', () => {
  it('requires the model before showing the first word choice', () => {
    const initial = initialEnglishSpeakingLessonState();
    expect(selectEnglishSpeakingChoice(initial, 'MY')).toBe(initial);
    expect(markEnglishSpeakingModelHeard(initial).step).toBe('choose-my');
  });

  it('discriminates MY and IS before opening the speaking turn', () => {
    let state = markEnglishSpeakingModelHeard(initialEnglishSpeakingLessonState());
    state = selectEnglishSpeakingChoice(state, 'ME');
    expect(state).toMatchObject({step: 'choose-my', retryCount: 1, highlightedChoice: 'MY'});

    state = selectEnglishSpeakingChoice(state, 'MY');
    expect(state).toMatchObject({step: 'choose-is', mySelected: true});

    state = selectEnglishSpeakingChoice(state, 'AM');
    state = selectEnglishSpeakingChoice(state, 'IS');
    expect(state).toMatchObject({step: 'speak', isSelected: true, retryCount: 2});
  });

  it('counts hints only while choosing a sight word', () => {
    const choosing = markEnglishSpeakingModelHeard(initialEnglishSpeakingLessonState());
    const hinted = requestEnglishSpeakingHint(choosing);
    expect(hinted).toMatchObject({hintCount: 1, highlightedChoice: 'MY'});
    const speaking = selectEnglishSpeakingChoice(selectEnglishSpeakingChoice(hinted, 'MY'), 'IS');
    expect(requestEnglishSpeakingHint(speaking)).toBe(speaking);
  });

  it('waits for an explicit finish, review, and repeat before completion', () => {
    let state = markEnglishSpeakingModelHeard(initialEnglishSpeakingLessonState());
    state = selectEnglishSpeakingChoice(state, 'MY');
    state = selectEnglishSpeakingChoice(state, 'IS');
    state = finishEnglishSpeakingTurn(state);
    expect(state.step).toBe('review');

    state = beginEnglishSpeakingRepeat(state);
    expect(state.step).toBe('repeat');
    state = finishEnglishSpeakingRepeat(state);
    expect(state.step).toBe('complete');
    expect(finishEnglishSpeakingRepeat(state)).toBe(state);
  });

  it('creates separate sight-word and greeting evidence without audio claims', () => {
    expect(createEnglishSpeakingEvidence(
      {hintCount: 1, retryCount: 2},
      '2026-07-13T00:00:00.000Z',
    )).toEqual([
      {
        topicId: 'tw_eng_g1_sight_words',
        correct: true,
        hintCount: 1,
        retryCount: 2,
        occurredAt: '2026-07-13T00:00:00.000Z',
      },
      {
        topicId: 'tw_eng_g1_greetings',
        correct: true,
        hintCount: 1,
        retryCount: 2,
        occurredAt: '2026-07-13T00:00:00.000Z',
      },
    ]);
  });
});
