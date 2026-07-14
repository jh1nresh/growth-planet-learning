import type {LearningEvidence} from '../../types';
import type {EnglishCourseScenario} from './englishCourse';

export type EnglishCardStep = 'model' | 'intent' | 'assemble' | 'speak' | 'review' | 'repeat' | 'complete';

export interface EnglishCardLessonState {
  step: EnglishCardStep;
  placedTokens: string[];
  hintCount: number;
  retryCount: number;
  highlightedChoice: string | null;
}

export interface EnglishCardLessonSummary {
  hintCount: number;
  retryCount: number;
}

export function initialEnglishCardLessonState(): EnglishCardLessonState {
  return {step: 'model', placedTokens: [], hintCount: 0, retryCount: 0, highlightedChoice: null};
}

export function markEnglishCardModelHeard(state: EnglishCardLessonState): EnglishCardLessonState {
  return state.step === 'model' ? {...state, step: 'intent'} : state;
}

export function selectEnglishCardIntent(
  state: EnglishCardLessonState,
  scenario: EnglishCourseScenario,
  choice: string,
): EnglishCardLessonState {
  if (state.step !== 'intent') return state;
  if (choice !== scenario.correctIntent) {
    return {...state, retryCount: state.retryCount + 1, highlightedChoice: scenario.correctIntent};
  }
  return {...state, step: 'assemble', highlightedChoice: null};
}

export function selectEnglishCardToken(
  state: EnglishCardLessonState,
  scenario: EnglishCourseScenario,
  token: string,
): EnglishCardLessonState {
  if (state.step !== 'assemble') return state;
  const expected = scenario.tokens[state.placedTokens.length];
  if (token !== expected) {
    return {...state, retryCount: state.retryCount + 1, highlightedChoice: expected};
  }
  const placedTokens = [...state.placedTokens, token];
  return {
    ...state,
    placedTokens,
    step: placedTokens.length === scenario.tokens.length ? 'speak' : 'assemble',
    highlightedChoice: null,
  };
}

export function requestEnglishCardHint(
  state: EnglishCardLessonState,
  scenario: EnglishCourseScenario,
): EnglishCardLessonState {
  const highlightedChoice = state.step === 'intent'
    ? scenario.correctIntent
    : state.step === 'assemble' ? scenario.tokens[state.placedTokens.length] : null;
  if (!highlightedChoice) return state;
  return {...state, hintCount: state.hintCount + 1, highlightedChoice};
}

export function finishEnglishCardTurn(state: EnglishCardLessonState): EnglishCardLessonState {
  return state.step === 'speak' ? {...state, step: 'review'} : state;
}

export function beginEnglishCardRepeat(state: EnglishCardLessonState): EnglishCardLessonState {
  return state.step === 'review' ? {...state, step: 'repeat'} : state;
}

export function finishEnglishCardRepeat(state: EnglishCardLessonState): EnglishCardLessonState {
  return state.step === 'repeat' ? {...state, step: 'complete'} : state;
}

export function createEnglishCardEvidence(
  scenario: EnglishCourseScenario,
  summary: EnglishCardLessonSummary,
  occurredAt: string,
): LearningEvidence[] {
  return scenario.evidenceTopicIds.map((topicId) => ({
    topicId,
    correct: true,
    hintCount: summary.hintCount,
    retryCount: summary.retryCount,
    occurredAt,
  }));
}
