import {describe, expect, it} from 'vitest';
import {
  createEnglishWordEvidence,
  initialEnglishWordLessonState,
  markEnglishWordHeard,
  requestEnglishWordHint,
  resetEnglishWord,
  selectEnglishWordLetter,
} from './englishWordLessonState';

describe('English word lesson', () => {
  it('requires listening before a child can place letters', () => {
    const initial = initialEnglishWordLessonState();
    expect(selectEnglishWordLetter(initial, 'C')).toBe(initial);
    expect(markEnglishWordHeard(initial).heard).toBe(true);
  });

  it('completes only after C, A, T are selected in order', () => {
    let state = markEnglishWordHeard(initialEnglishWordLessonState());
    state = selectEnglishWordLetter(state, 'C');
    state = selectEnglishWordLetter(state, 'A');
    state = selectEnglishWordLetter(state, 'T');

    expect(state.placed).toEqual(['C', 'A', 'T']);
    expect(state.feedback).toBe('complete');
    expect(state.retryCount).toBe(0);
  });

  it('tracks a wrong choice and points to the expected letter', () => {
    const heard = markEnglishWordHeard(initialEnglishWordLessonState());
    const state = selectEnglishWordLetter(heard, 'T');

    expect(state.placed).toEqual([]);
    expect(state.retryCount).toBe(1);
    expect(state.highlightedLetter).toBe('C');
  });

  it('keeps assistance counts when resetting the current attempt', () => {
    let state = markEnglishWordHeard(initialEnglishWordLessonState());
    state = requestEnglishWordHint(state);
    state = selectEnglishWordLetter(state, 'C');
    state = resetEnglishWord(state);

    expect(state.placed).toEqual([]);
    expect(state.hintCount).toBe(1);
    expect(state.heard).toBe(true);
  });

  it('creates one deterministic learning evidence event', () => {
    expect(createEnglishWordEvidence(
      {hintCount: 1, retryCount: 2},
      '2026-07-13T00:00:00.000Z',
    )).toEqual({
      topicId: 'tw_eng_g1_letter_sounds',
      correct: true,
      hintCount: 1,
      retryCount: 2,
      occurredAt: '2026-07-13T00:00:00.000Z',
    });
  });
});
