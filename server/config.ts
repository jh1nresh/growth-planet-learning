import {ApiError} from './http';

export interface ServerConfig {
  privyAppId: string;
  supabaseUrl: string;
  supabaseSecretKey: string;
  sessionPepper: string;
}

function requireValue(value: string | undefined, name: string) {
  const trimmed = value?.trim();
  if (!trimmed) throw new ApiError(503, 'service_not_configured', `缺少 ${name}，雲端家庭帳號尚未啟用。`);
  return trimmed;
}

export function getServerConfig(): ServerConfig {
  const sessionPepper = requireValue(process.env.OSHIAMI_SESSION_PEPPER, 'OSHIAMI_SESSION_PEPPER');
  if (sessionPepper.length < 32) {
    throw new ApiError(503, 'service_not_configured', 'OSHIAMI_SESSION_PEPPER 長度不足。');
  }

  return {
    privyAppId: requireValue(process.env.PRIVY_APP_ID ?? process.env.VITE_PRIVY_APP_ID, 'PRIVY_APP_ID'),
    supabaseUrl: requireValue(process.env.SUPABASE_URL, 'SUPABASE_URL'),
    supabaseSecretKey: requireValue(process.env.SUPABASE_SECRET_KEY, 'SUPABASE_SECRET_KEY'),
    sessionPepper,
  };
}
