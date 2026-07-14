import {describe, expect, it} from 'vitest';
import type {ChildProfile} from '../features/family/familyTypes';
import {pruneDeletedChildCaches} from './useFamily';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const CURRENT_CHILD = '550e8400-e29b-41d4-a716-446655440000';
const DELETED_CHILD = 'a8098c1a-f86e-41da-bd1d-4c7f4e8ab9c1';

describe('family cache cleanup', () => {
  it('removes deleted child progress after a later device snapshot without touching guest or current-child data', () => {
    const storage = new MemoryStorage();
    storage.setItem(`growth-planet:progress:v1:child:${CURRENT_CHILD}`, 'current progress');
    storage.setItem(`growth-planet:sync:v1:child:${CURRENT_CHILD}`, 'current sync');
    storage.setItem(`growth-planet:progress:v1:child:${DELETED_CHILD}`, 'deleted progress');
    storage.setItem(`growth-planet:sync:v1:child:${DELETED_CHILD}`, 'deleted sync');
    storage.setItem('growth-planet:progress:v1:guest', 'guest progress');

    const profiles: ChildProfile[] = [{id: CURRENT_CHILD, alias: '小星', avatarId: 'star'}];
    pruneDeletedChildCaches(storage, profiles);

    expect(storage.getItem(`growth-planet:progress:v1:child:${CURRENT_CHILD}`)).toBe('current progress');
    expect(storage.getItem(`growth-planet:sync:v1:child:${CURRENT_CHILD}`)).toBe('current sync');
    expect(storage.getItem(`growth-planet:progress:v1:child:${DELETED_CHILD}`)).toBeNull();
    expect(storage.getItem(`growth-planet:sync:v1:child:${DELETED_CHILD}`)).toBeNull();
    expect(storage.getItem('growth-planet:progress:v1:guest')).toBe('guest progress');
  });
});
