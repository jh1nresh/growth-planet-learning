import type {EnglishCourseScenario} from './englishCourse';

export type EnglishRoomPosition = 'on' | 'under' | 'next-to';
export type EnglishRoomStep = 'position' | 'assemble' | 'speak' | 'review' | 'repeat' | 'complete';

export const ENGLISH_ROOM_CHALLENGES: readonly EnglishRoomPosition[] = ['under', 'on'];

export interface EnglishRoomLessonState {
  step: EnglishRoomStep;
  bagPosition: EnglishRoomPosition;
  challengeIndex: number;
  placedTokens: string[];
  hintCount: number;
  retryCount: number;
  highlightedPosition: EnglishRoomPosition | null;
  highlightedToken: string | null;
}

export interface EnglishRoomLessonSummary {
  hintCount: number;
  retryCount: number;
}

export function initialEnglishRoomLessonState(): EnglishRoomLessonState {
  return {
    step: 'position',
    bagPosition: 'next-to',
    challengeIndex: 0,
    placedTokens: [],
    hintCount: 0,
    retryCount: 0,
    highlightedPosition: null,
    highlightedToken: null,
  };
}

export function moveEnglishRoomBag(
  state: EnglishRoomLessonState,
  bagPosition: EnglishRoomPosition,
): EnglishRoomLessonState {
  return state.step === 'position'
    ? {...state, bagPosition, highlightedPosition: null}
    : state;
}

export function checkEnglishRoomPosition(state: EnglishRoomLessonState): EnglishRoomLessonState {
  if (state.step !== 'position') return state;
  const target = ENGLISH_ROOM_CHALLENGES[state.challengeIndex];
  if (state.bagPosition !== target) {
    return {
      ...state,
      retryCount: state.retryCount + 1,
      highlightedPosition: target,
    };
  }
  if (state.challengeIndex < ENGLISH_ROOM_CHALLENGES.length - 1) {
    return {
      ...state,
      challengeIndex: state.challengeIndex + 1,
      bagPosition: 'next-to',
      highlightedPosition: null,
    };
  }
  return {
    ...state,
    step: 'assemble',
    bagPosition: 'under',
    highlightedPosition: null,
  };
}

export function selectEnglishRoomToken(
  state: EnglishRoomLessonState,
  scenario: EnglishCourseScenario,
  token: string,
): EnglishRoomLessonState {
  if (state.step !== 'assemble') return state;
  const expected = scenario.tokens[state.placedTokens.length];
  if (token !== expected) {
    return {
      ...state,
      retryCount: state.retryCount + 1,
      highlightedToken: expected,
    };
  }
  const placedTokens = [...state.placedTokens, token];
  return {
    ...state,
    placedTokens,
    step: placedTokens.length === scenario.tokens.length ? 'speak' : 'assemble',
    highlightedToken: null,
  };
}

export function requestEnglishRoomHint(
  state: EnglishRoomLessonState,
  scenario: EnglishCourseScenario,
): EnglishRoomLessonState {
  if (state.step === 'position') {
    return {
      ...state,
      hintCount: state.hintCount + 1,
      highlightedPosition: ENGLISH_ROOM_CHALLENGES[state.challengeIndex],
    };
  }
  if (state.step === 'assemble') {
    return {
      ...state,
      hintCount: state.hintCount + 1,
      highlightedToken: scenario.tokens[state.placedTokens.length],
    };
  }
  return state;
}

export function finishEnglishRoomTurn(state: EnglishRoomLessonState): EnglishRoomLessonState {
  return state.step === 'speak' ? {...state, step: 'review'} : state;
}

export function beginEnglishRoomRepeat(state: EnglishRoomLessonState): EnglishRoomLessonState {
  return state.step === 'review' ? {...state, step: 'repeat'} : state;
}

export function finishEnglishRoomRepeat(state: EnglishRoomLessonState): EnglishRoomLessonState {
  return state.step === 'repeat' ? {...state, step: 'complete'} : state;
}
