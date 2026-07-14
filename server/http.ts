export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
  responseHeaders.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(body), {status, headers: responseHeaders});
}

export async function parseJsonBody(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 300_000) {
    throw new ApiError(413, 'payload_too_large', '資料量太大，請重新整理後再試。');
  }

  const text = await request.text();
  if (text.length > 300_000) throw new ApiError(413, 'payload_too_large', '資料量太大，請重新整理後再試。');

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, 'invalid_json', '送出的資料格式不正確。');
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    throw new ApiError(403, 'invalid_origin', '這個操作必須從 Oshiami 頁面執行。');
  }
}

export function methodNotAllowed(methods: string[]) {
  return jsonResponse(
    {error: {code: 'method_not_allowed', message: '不支援這個操作。'}},
    405,
    {Allow: methods.join(', ')},
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonResponse({error: {code: error.code, message: error.message, details: error.details}}, error.status);
  }

  console.error('Oshiami family API failed', error instanceof Error ? error.message : 'unknown error');
  return jsonResponse({error: {code: 'internal_error', message: '服務暫時無法使用，請稍後再試。'}}, 500);
}
