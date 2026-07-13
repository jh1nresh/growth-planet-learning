import {describe, expect, it} from 'vitest';
import {
  createChineseZhuyinEvidence,
  initialChineseZhuyinLessonState,
  markChineseWordHeard,
  requestChineseZhuyinHint,
  selectChineseZhuyinSymbol,
} from './chineseZhuyinLessonState';

describe('Chinese Zhuyin lesson', () => {
  it('requires listening before accepting symbols', () => {
    const initial = initialChineseZhuyinLessonState();
    expect(selectChineseZhuyinSymbol(initial, 'ㄇ')).toBe(initial);
  });

  it('counts submitted wrong choices and highlights the expected symbol', () => {
    const heard = markChineseWordHeard(initialChineseZhuyinLessonState());
    const next = selectChineseZhuyinSymbol(heard, 'ˇ');
    expect(next).toMatchObject({retryCount: 1, feedback: 'wrong', highlightedSymbol: 'ㄇ'});
  });

  it('tracks hints and completes only the ordered sequence', () => {
    let state = markChineseWordHeard(initialChineseZhuyinLessonState());
    state = requestChineseZhuyinHint(state);
    state = selectChineseZhuyinSymbol(state, 'ㄇ');
    state = selectChineseZhuyinSymbol(state, 'ㄧ');
    state = selectChineseZhuyinSymbol(state, 'ˇ');
    expect(state).toMatchObject({feedback: 'complete', placed: ['ㄇ', 'ㄧ', 'ˇ'], hintCount: 1});
    expect(selectChineseZhuyinSymbol(state, 'ㄇ')).toBe(state);
  });

  it('creates deterministic learner evidence', () => {
    expect(createChineseZhuyinEvidence({hintCount: 1, retryCount: 2}, '2026-07-13T00:00:00.000Z')).toEqual({
      topicId: 'tw_zh_g1_zhuyin_symbols',
      correct: true,
      hintCount: 1,
      retryCount: 2,
      occurredAt: '2026-07-13T00:00:00.000Z',
    });
  });
});
