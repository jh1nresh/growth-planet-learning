import type {LearningEvidence} from '../../types';

export const ENGLISH_SPEAKING_MY_CHOICES = ['I', 'MY', 'ME'] as const;
export const ENGLISH_SPEAKING_IS_CHOICES = ['AM', 'ARE', 'IS'] as const;
export const ENGLISH_SIGHT_WORDS_TOPIC_ID = 'tw_eng_g1_sight_words';
export const ENGLISH_GREETINGS_TOPIC_ID = 'tw_eng_g1_greetings';

export type EnglishSpeakingChoice =
  | typeof ENGLISH_SPEAKING_MY_CHOICES[number]
  | typeof ENGLISH_SPEAKING_IS_CHOICES[number];
export type EnglishSpeakingStep = 'model' | 'choose-my' | 'choose-is' | 'speak' | 'review' | 'repeat' | 'complete';

export interface EnglishSpeakingLessonState {
  step: EnglishSpeakingStep;
  mySelected: boolean;
  isSelected: boolean;
  hintCount: number;
  retryCount: number;
  highlightedChoice: 'MY' | 'IS' | null;
}

export interface EnglishSpeakingLessonSummary {
  hintCount: number;
  retryCount: number;
}

export function initialEnglishSpeakingLessonState(): EnglishSpeakingLessonState {
  return {
    step: 'model',
    mySelected: false,
    isSelected: false,
    hintCount: 0,
    retryCount: 0,
    highlightedChoice: null,
  };
}

export function markEnglishSpeakingModelHeard(state: EnglishSpeakingLessonState): EnglishSpeakingLessonState {
  return state.step === 'model' ? {...state, step: 'choose-my'} : state;
}

export function selectEnglishSpeakingChoice(
  state: EnglishSpeakingLessonState,
  choice: EnglishSpeakingChoice,
): EnglishSpeakingLessonState {
  const expected = state.step === 'choose-my' ? 'MY' : state.step === 'choose-is' ? 'IS' : null;
  if (!expected) return state;
  if (choice !== expected) {
    return {
      ...state,
      retryCount: state.retryCount + 1,
      highlightedChoice: expected,
    };
  }

  return expected === 'MY'
    ? {...state, step: 'choose-is', mySelected: true, highlightedChoice: null}
    : {...state, step: 'speak', isSelected: true, highlightedChoice: null};
}

export function requestEnglishSpeakingHint(state: EnglishSpeakingLessonState): EnglishSpeakingLessonState {
  const highlightedChoice = state.step === 'choose-my' ? 'MY' : state.step === 'choose-is' ? 'IS' : null;
  if (!highlightedChoice) return state;
  return {
    ...state,
    hintCount: state.hintCount + 1,
    highlightedChoice,
  };
}

export function finishEnglishSpeakingTurn(state: EnglishSpeakingLessonState): EnglishSpeakingLessonState {
  return state.step === 'speak' ? {...state, step: 'review'} : state;
}

export function beginEnglishSpeakingRepeat(state: EnglishSpeakingLessonState): EnglishSpeakingLessonState {
  return state.step === 'review' ? {...state, step: 'repeat'} : state;
}

export function finishEnglishSpeakingRepeat(state: EnglishSpeakingLessonState): EnglishSpeakingLessonState {
  return state.step === 'repeat' ? {...state, step: 'complete'} : state;
}

export function createEnglishSpeakingEvidence(
  summary: EnglishSpeakingLessonSummary,
  occurredAt: string,
): LearningEvidence[] {
  return [ENGLISH_SIGHT_WORDS_TOPIC_ID, ENGLISH_GREETINGS_TOPIC_ID].map((topicId) => ({
    topicId,
    correct: true,
    hintCount: summary.hintCount,
    retryCount: summary.retryCount,
    occurredAt,
  }));
}
