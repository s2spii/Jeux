/**
 * Password hashing using WebCrypto PBKDF2. The platform is local-first
 * (accounts live in the browser), so we never store plaintext passwords:
 * each account keeps a random salt and a derived hash. The same primitive
 * can back a serverless auth endpoint without changing the client model.
 */

const ITERATIONS = 120_000;

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

async function derive(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(
    saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)),
  );
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  return toHex(bits);
}

export interface PasswordRecord {
  salt: string;
  hash: string;
}

export async function hashPassword(password: string): Promise<PasswordRecord> {
  const salt = randomSalt();
  const hash = await derive(password, salt);
  return { salt, hash };
}

export async function verifyPassword(
  password: string,
  record: PasswordRecord,
): Promise<boolean> {
  const hash = await derive(password, record.salt);
  // Constant-time-ish comparison.
  if (hash.length !== record.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) {
    diff |= hash.charCodeAt(i) ^ record.hash.charCodeAt(i);
  }
  return diff === 0;
}
