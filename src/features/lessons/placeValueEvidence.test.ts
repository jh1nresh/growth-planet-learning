import {describe, expect, it} from 'vitest';
import {createPlaceValueEvidence} from './placeValueEvidence';

describe('place value lesson evidence', () => {
  it('records one event for each observed Math ability', () => {
    const evidence = createPlaceValueEvidence({hintCount: 1, retryCount: 2}, '2026-07-13T00:00:00.000Z');
    expect(evidence.map((event) => event.topicId)).toEqual([
      'tw_math_g1_count_20',
      'tw_math_g1_bundle_ten',
      'tw_math_g1_tens_ones',
    ]);
    expect(new Set(evidence.map((event) => event.topicId)).size).toBe(3);
    expect(evidence.every((event) => event.hintCount === 1 && event.retryCount === 2)).toBe(true);
  });
});
