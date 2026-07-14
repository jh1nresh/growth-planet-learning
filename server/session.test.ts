import {describe, expect, it} from 'vitest';
import {childSessionMatches} from './session';

describe('child session lifecycle', () => {
  it('clears the browser session only when the changed or deleted profile is active', () => {
    const activeSession = {childProfileId: '550e8400-e29b-41d4-a716-446655440000'};

    expect(childSessionMatches(activeSession, activeSession.childProfileId)).toBe(true);
    expect(childSessionMatches(activeSession, 'a8098c1a-f86e-41da-bd1d-4c7f4e8ab9c1')).toBe(false);
    expect(childSessionMatches(null, activeSession.childProfileId)).toBe(false);
  });
});
