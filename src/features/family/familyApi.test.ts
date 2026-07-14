import {afterEach, describe, expect, it, vi} from 'vitest';
import {emptyProgress} from '../../lib/progress';
import {createFamilyApi, FamilyApiError} from './familyApi';

const CHILD_ID = '550e8400-e29b-41d4-a716-446655440000';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json'},
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('family progress API', () => {
  it('binds both progress reads and writes to the intended child ID', async () => {
    const progress = emptyProgress();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({progress, revision: 1}))
      .mockResolvedValueOnce(jsonResponse({progress, revision: 2}));
    vi.stubGlobal('fetch', fetchMock);
    const api = createFamilyApi(async () => null);

    await api.loadProgress(CHILD_ID);
    await api.saveProgress(CHILD_ID, progress, 1);

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/progress', {
      headers: {'X-Oshiami-Child-Id': CHILD_ID},
      credentials: 'same-origin',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/progress', {
      method: 'PUT',
      headers: {'Content-Type': 'application/json', 'X-Oshiami-Child-Id': CHILD_ID},
      body: JSON.stringify({progress, revision: 1}),
      credentials: 'same-origin',
    });
  });

  it('preserves the current cloud snapshot when the server reports a revision conflict', async () => {
    const current = {progress: {...emptyProgress(), xp: 45}, revision: 3};
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      error: {code: 'progress_conflict', message: '雲端已有新進度。', details: current},
    }, 409)));
    const api = createFamilyApi(async () => null);

    await expect(api.saveProgress(CHILD_ID, emptyProgress(), 1)).rejects.toMatchObject({
      status: 409,
      code: 'progress_conflict',
      details: current,
    } satisfies Partial<FamilyApiError>);
  });
});
