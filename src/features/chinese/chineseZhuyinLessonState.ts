import type {LearningEvidence} from '../../types';

export const CHINESE_ZHUYIN_SEQUENCE = ['ㄇ', 'ㄧ', 'ˇ'] as const;
export const CHINESE_ZHUYIN_TILES = ['ˇ', 'ㄇ', 'ㄧ'] as const;
export const CHINESE_ZHUYIN_TOPIC_ID = 'tw_zh_g1_zhuyin_symbols';

export type ChineseZhuyinSymbol = typeof CHINESE_ZHUYIN_SEQUENCE[number];
export type ChineseZhuyinFeedback = 'ready' | 'listened' | 'correct' | 'wrong' | 'hint' | 'complete';

export interface ChineseZhuyinLessonState {
  heard: boolean;
  placed: ChineseZhuyinSymbol[];
  hintCount: number;
  retryCount: number;
  feedback: ChineseZhuyinFeedback;
  highlightedSymbol: ChineseZhuyinSymbol | null;
}

export interface ChineseZhuyinLessonSummary {
  hintCount: number;
  retryCount: number;
}

export function initialChineseZhuyinLessonState(): ChineseZhuyinLessonState {
  return {heard: false, placed: [], hintCount: 0, retryCount: 0, feedback: 'ready', highlightedSymbol: null};
}

export function markChineseWordHeard(state: ChineseZhuyinLessonState): ChineseZhuyinLessonState {
  return {...state, heard: true, feedback: 'listened', highlightedSymbol: null};
}

export function selectChineseZhuyinSymbol(
  state: ChineseZhuyinLessonState,
  symbol: ChineseZhuyinSymbol,
): ChineseZhuyinLessonState {
  if (!state.heard || state.feedback === 'complete' || state.placed.includes(symbol)) return state;
  const expected = CHINESE_ZHUYIN_SEQUENCE[state.placed.length];
  if (symbol !== expected) {
    return {...state, retryCount: state.retryCount + 1, feedback: 'wrong', highlightedSymbol: expected};
  }
  const placed = [...state.placed, symbol];
  return {
    ...state,
    placed,
    feedback: placed.length === CHINESE_ZHUYIN_SEQUENCE.length ? 'complete' : 'correct',
    highlightedSymbol: null,
  };
}

export function requestChineseZhuyinHint(state: ChineseZhuyinLessonState): ChineseZhuyinLessonState {
  if (!state.heard || state.feedback === 'complete') return state;
  return {
    ...state,
    hintCount: state.hintCount + 1,
    feedback: 'hint',
    highlightedSymbol: CHINESE_ZHUYIN_SEQUENCE[state.placed.length],
  };
}

export function resetChineseZhuyin(state: ChineseZhuyinLessonState): ChineseZhuyinLessonState {
  if (state.feedback === 'complete') return state;
  return {...state, placed: [], feedback: state.heard ? 'listened' : 'ready', highlightedSymbol: null};
}

export function createChineseZhuyinEvidence(
  summary: ChineseZhuyinLessonSummary,
  occurredAt: string,
): LearningEvidence {
  return {
    topicId: CHINESE_ZHUYIN_TOPIC_ID,
    correct: true,
    hintCount: summary.hintCount,
    retryCount: summary.retryCount,
    occurredAt,
  };
}
