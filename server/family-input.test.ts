import {describe, expect, it} from 'vitest';
import {ApiError} from './http';
import {assertSessionChild, childIdFrom, parseCreateProfileInput, parseUnlockInput, parseUpdateProfileInput} from './family-input';

const CHILD_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('family request validation', () => {
  it('normalizes aliases and preserves a leading-zero PIN', () => {
    expect(parseCreateProfileInput({
      alias: '  e\u0301<小\n星>  ',
      avatarId: 'sprout',
      pin: '0123',
    })).toEqual({alias: 'é小星', avatarId: 'sprout', pin: '0123'});
  });

  it('accepts an optional empty PIN only for profile edits', () => {
    expect(parseUpdateProfileInput({childId: CHILD_ID, alias: '小星', avatarId: 'moon', pin: ''})).toEqual({
      childId: CHILD_ID,
      alias: '小星',
      avatarId: 'moon',
      pin: null,
    });
  });

  it.each([
    [{alias: '', avatarId: 'sprout', pin: '1234'}, 'invalid_alias'],
    [{alias: '小星', avatarId: 'remote-image', pin: '1234'}, 'invalid_avatar'],
    [{alias: '小星', avatarId: 'star', pin: '123'}, 'invalid_pin'],
    [null, 'invalid_request'],
  ])('rejects invalid create input %#', (input, code) => {
    expect(() => parseCreateProfileInput(input)).toThrowError(ApiError);
    try {
      parseCreateProfileInput(input);
    } catch (error) {
      expect(error).toMatchObject({status: 400, code});
    }
  });

  it('rejects malformed child IDs before a PIN is checked', () => {
    expect(() => childIdFrom('not-a-uuid')).toThrowError(ApiError);
    expect(() => parseUnlockInput({childId: 'not-a-uuid', pin: '1234'})).toThrowError(ApiError);
  });

  it('rejects a progress request after the device switches to a different child', () => {
    expect(() => assertSessionChild(CHILD_ID, CHILD_ID)).not.toThrow();
    expect(() => assertSessionChild('a8098c1a-f86e-41da-bd1d-4c7f4e8ab9c1', CHILD_ID)).toThrowError(ApiError);
    try {
      assertSessionChild('a8098c1a-f86e-41da-bd1d-4c7f4e8ab9c1', CHILD_ID);
    } catch (error) {
      expect(error).toMatchObject({status: 409, code: 'child_session_changed'});
    }
  });
});
