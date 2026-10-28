// Criptografia dos dados na nuvem: a chave nasce da senha do app (a senha em si não está no código).
// Sem a senha, quem acessar o banco só vê dados ilegíveis; adulterações falham na verificação do AES-GCM.

const SALT_KEY = 'materiais-key-v1';
const SALT_CHECK = 'capla-check-v1';
const ITERATIONS = 600000;
const VERIFIER = 'pnVyWu9wKzdbXBkH3DsqYJY93r8FigdNeq2R10tAWIM='; // PBKDF2(senha, SALT_CHECK)
const SESSION_KEY = 'materiais-session-key';

export interface EncryptedPayload { v: 1; iv: string; ct: string }

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(bin);
}

function fromB64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pbkdf2(password: string, salt: string): Promise<ArrayBuffer> {
  const base = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: ITERATIONS }, base, 256,
  );
}

let cachedKey: CryptoKey | null = null;

/** Confere a senha e, se correta, guarda a chave só nesta aba (sessionStorage). */
export async function verifyPassword(password: string): Promise<boolean> {
  if (toB64(await pbkdf2(password, SALT_CHECK)) !== VERIFIER) return false;
  sessionStorage.setItem(SESSION_KEY, toB64(await pbkdf2(password, SALT_KEY)));
  cachedKey = null;
  return true;
}

export const hasKey = (): boolean => {
  try { return !!sessionStorage.getItem(SESSION_KEY); } catch { return false; }
};

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) throw new Error('Faça login para acessar os dados.');
  cachedKey = await crypto.subtle.importKey('raw', fromB64(raw), 'AES-GCM', false, ['encrypt', 'decrypt']);
  return cachedKey;
}

/** `aad` amarra o conteúdo ao id da linha (impede trocar o conteúdo entre linhas). */
export async function encryptJson(obj: unknown, aad: string): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(aad) }, await getKey(), encoder.encode(JSON.stringify(obj)),
  );
  return { v: 1, iv: toB64(iv), ct: toB64(ct) };
}

export async function decryptJson<T>(p: EncryptedPayload, aad: string): Promise<T> {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(p.iv), additionalData: encoder.encode(aad) }, await getKey(), fromB64(p.ct),
  );
  return JSON.parse(decoder.decode(plain)) as T;
}

export const isEncryptedPayload = (x: unknown): x is EncryptedPayload =>
  !!x && typeof x === 'object' && (x as EncryptedPayload).v === 1 && typeof (x as EncryptedPayload).ct === 'string';
