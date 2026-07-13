import type {LearningEvidence} from '../../types';

export const ENGLISH_WORD = ['C', 'A', 'T'] as const;
export const ENGLISH_WORD_TILES = ['T', 'C', 'A'] as const;
export const ENGLISH_WORD_TOPIC_ID = 'tw_eng_g1_letter_sounds';
export const ENGLISH_WORD_MISSION_ID = 'mission_english_first_dock';

export type EnglishWordLetter = typeof ENGLISH_WORD[number];
export type EnglishWordFeedback = 'ready' | 'listened' | 'correct' | 'wrong' | 'hint' | 'complete';

export interface EnglishWordLessonState {
  heard: boolean;
  placed: EnglishWordLetter[];
  hintCount: number;
  retryCount: number;
  feedback: EnglishWordFeedback;
  highlightedLetter: EnglishWordLetter | null;
}

export interface EnglishWordLessonSummary {
  hintCount: number;
  retryCount: number;
}

export function initialEnglishWordLessonState(): EnglishWordLessonState {
  return {
    heard: false,
    placed: [],
    hintCount: 0,
    retryCount: 0,
    feedback: 'ready',
    highlightedLetter: null,
  };
}

export function markEnglishWordHeard(state: EnglishWordLessonState): EnglishWordLessonState {
  return {...state, heard: true, feedback: 'listened', highlightedLetter: null};
}

export function selectEnglishWordLetter(
  state: EnglishWordLessonState,
  letter: EnglishWordLetter,
): EnglishWordLessonState {
  if (!state.heard || state.feedback === 'complete' || state.placed.includes(letter)) return state;

  const expected = ENGLISH_WORD[state.placed.length];
  if (letter !== expected) {
    return {
      ...state,
      retryCount: state.retryCount + 1,
      feedback: 'wrong',
      highlightedLetter: expected,
    };
  }

  const placed = [...state.placed, letter];
  return {
    ...state,
    placed,
    feedback: placed.length === ENGLISH_WORD.length ? 'complete' : 'correct',
    highlightedLetter: null,
  };
}

export function requestEnglishWordHint(state: EnglishWordLessonState): EnglishWordLessonState {
  if (!state.heard || state.feedback === 'complete') return state;
  return {
    ...state,
    hintCount: state.hintCount + 1,
    feedback: 'hint',
    highlightedLetter: ENGLISH_WORD[state.placed.length],
  };
}

export function resetEnglishWord(state: EnglishWordLessonState): EnglishWordLessonState {
  if (state.feedback === 'complete') return state;
  return {
    ...state,
    placed: [],
    feedback: state.heard ? 'listened' : 'ready',
    highlightedLetter: null,
  };
}

export function createEnglishWordEvidence(
  summary: EnglishWordLessonSummary,
  occurredAt: string,
): LearningEvidence {
  return {
    topicId: ENGLISH_WORD_TOPIC_ID,
    correct: true,
    hintCount: summary.hintCount,
    retryCount: summary.retryCount,
    occurredAt,
  };
}
