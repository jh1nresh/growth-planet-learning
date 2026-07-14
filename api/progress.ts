import {getServerConfig} from '../server/config';
import {getDatabase, getProgress, saveProgress} from '../server/database';
import {assertSessionChild} from '../server/family-input';
import {ApiError, assertSameOrigin, handleApiError, jsonResponse, methodNotAllowed, parseJsonBody} from '../server/http';
import {requireChildSession} from '../server/session';
import {parseProgressState} from '../src/lib/progress';

function parseSaveInput(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, 'invalid_progress', '學習進度格式不正確。');
  }
  const input = value as Record<string, unknown>;
  const progress = parseProgressState(input.progress);
  if (!progress || !Number.isInteger(input.revision) || (input.revision as number) < 1) {
    throw new ApiError(400, 'invalid_progress', '學習進度格式不正確。');
  }
  return {progress, revision: input.revision as number};
}

export async function GET(request: Request) {
  try {
    const config = getServerConfig();
    const db = getDatabase(config);
    const {session} = await requireChildSession(request, db, config.sessionPepper);
    assertSessionChild(request.headers.get('x-oshiami-child-id'), session.childProfileId);
    return jsonResponse(await getProgress(db, session));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const config = getServerConfig();
    const db = getDatabase(config);
    const {session} = await requireChildSession(request, db, config.sessionPepper);
    assertSessionChild(request.headers.get('x-oshiami-child-id'), session.childProfileId);
    const input = parseSaveInput(await parseJsonBody(request));
    const saved = await saveProgress(db, session, input.progress, input.revision);
    if (saved.conflict) {
      throw new ApiError(409, 'progress_conflict', '另一台裝置已更新進度，請重新載入後再試。', saved.current);
    }
    return jsonResponse(saved.current);
  } catch (error) {
    return handleApiError(error);
  }
}

export default {
  fetch(request: Request) {
    if (request.method === 'GET') return GET(request);
    if (request.method === 'PUT') return PUT(request);
    return methodNotAllowed(['GET', 'PUT']);
  },
};
