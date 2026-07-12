import {describe, expect, it} from 'vitest';
import {selectionShouldClear, toggleVisibleSubject, type LearningSubject} from './subjectFilter';

describe('subject filtering', () => {
  const both = new Set<LearningSubject>(['Mathematics', 'English']);

  it('hides one subject while keeping the other visible', () => {
    expect([...toggleVisibleSubject(both, 'English')]).toEqual(['Mathematics']);
  });

  it('never hides the final visible subject', () => {
    const mathOnly = new Set<LearningSubject>(['Mathematics']);
    expect([...toggleVisibleSubject(mathOnly, 'Mathematics')]).toEqual(['Mathematics']);
  });

  it('adds a hidden subject back', () => {
    const mathOnly = new Set<LearningSubject>(['Mathematics']);
    expect([...toggleVisibleSubject(mathOnly, 'English')]).toEqual(['Mathematics', 'English']);
  });

  it('clears a selection only when its visible subject is being hidden', () => {
    expect(selectionShouldClear('English', 'English', both)).toBe(true);
    expect(selectionShouldClear('Mathematics', 'English', both)).toBe(false);
    expect(selectionShouldClear('Mathematics', 'Mathematics', new Set(['Mathematics']))).toBe(false);
  });
});
