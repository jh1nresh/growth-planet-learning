import {createHmac, randomBytes, scrypt, timingSafeEqual} from 'node:crypto';
import {ApiError} from './http';

const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_KEY_LENGTH = 32;

export const DEVICE_COOKIE = 'oshiami-device';
export const CHILD_SESSION_COOKIE = 'oshiami-child';

export function createOpaqueToken() {
  return randomBytes(32).toString('base64url');
}

export function hashOpaqueToken(token: string, pepper: string) {
  return createHmac('sha256', pepper).update(token).digest('hex');
}

function derivePin(pin: string, pepper: string, salt: Buffer, cost: number, blockSize: number, parallelization: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(`${pin}:${pepper}`, salt, SCRYPT_KEY_LENGTH, {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: 64 * 1024 * 1024,
    }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPin(pin: string, pepper: string) {
  if (!/^\d{4}$/.test(pin)) throw new ApiError(400, 'invalid_pin', 'PIN 必須是 4 位數字。');
  const salt = randomBytes(16);
  const key = await derivePin(pin, pepper, salt, SCRYPT_COST, SCRYPT_BLOCK_SIZE, SCRYPT_PARALLELIZATION);
  return ['scrypt', 'v1', SCRYPT_COST, SCRYPT_BLOCK_SIZE, SCRYPT_PARALLELIZATION, salt.toString('base64url'), key.toString('base64url')].join('$');
}

export async function verifyPin(pin: string, encoded: string, pepper: string) {
  if (!/^\d{4}$/.test(pin)) return false;
  const [algorithm, version, costText, blockSizeText, parallelizationText, saltText, keyText] = encoded.split('$');
  if (algorithm !== 'scrypt' || version !== 'v1' || !saltText || !keyText) return false;
  const cost = Number(costText);
  const blockSize = Number(blockSizeText);
  const parallelization = Number(parallelizationText);
  if (cost !== SCRYPT_COST || blockSize !== SCRYPT_BLOCK_SIZE || parallelization !== SCRYPT_PARALLELIZATION) return false;

  try {
    const expected = Buffer.from(keyText, 'base64url');
    const actual = await derivePin(pin, pepper, Buffer.from(saltText, 'base64url'), cost, blockSize, parallelization);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function parseCookies(header: string | null) {
  const cookies = new Map<string, string>();
  for (const pair of header?.split(';') ?? []) {
    const separator = pair.indexOf('=');
    if (separator < 1) continue;
    cookies.set(pair.slice(0, separator).trim(), decodeURIComponent(pair.slice(separator + 1).trim()));
  }
  return cookies;
}

export function readCookie(request: Request, name: string) {
  const cookies = parseCookies(request.headers.get('cookie'));
  return cookies.get(`__Host-${name}`) ?? cookies.get(name) ?? null;
}

export function serializeCookie(request: Request, name: string, value: string, maxAgeSeconds: number) {
  const secure = new URL(request.url).protocol === 'https:';
  const cookieName = secure ? `__Host-${name}` : name;
  const attributes = [
    `${cookieName}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ];
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}
