import type { KVNamespace } from '@cloudflare/workers-types';

export interface CodeRecord {
  userId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scope: string;
  exp: number;
}

export interface TokenRecord {
  userId: string;
  scope: string;
  tokenId: string;
}

export interface GrantRecord {
  accessToken: string;
  refreshToken: string;
}

export const TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days

const ALLOWED_CLIENT_IDS = ['minhagent-app'];
const ALLOWED_REDIRECT_URIS = ['minhagent://oauth/callback'];

export function validateClient(clientId: string, redirectUri: string): boolean {
  return ALLOWED_CLIENT_IDS.includes(clientId) && ALLOWED_REDIRECT_URIS.includes(redirectUri);
}

export async function verifyPKCE(verifier: string, challenge: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const base64url = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return base64url === challenge;
}

export async function storeCode(kv: KVNamespace, code: string, record: CodeRecord): Promise<void> {
  await kv.put(`code:${code}`, JSON.stringify(record), { expirationTtl: 300 });
}

export async function loadAndDeleteCode(kv: KVNamespace, code: string): Promise<CodeRecord | null> {
  const raw = await kv.get(`code:${code}`);
  if (!raw) return null;
  await kv.delete(`code:${code}`);
  const record = JSON.parse(raw) as CodeRecord;
  if (Date.now() > record.exp) return null;
  return record;
}

export async function storeToken(
  kv: KVNamespace,
  token: string,
  record: TokenRecord,
): Promise<void> {
  await kv.put(`token:${token}`, JSON.stringify(record), { expirationTtl: TOKEN_TTL });
}

export async function storeRefreshToken(
  kv: KVNamespace,
  refreshToken: string,
  record: TokenRecord,
): Promise<void> {
  await kv.put(`refresh:${refreshToken}`, JSON.stringify(record), { expirationTtl: TOKEN_TTL });
}

export async function loadAndDeleteRefreshToken(
  kv: KVNamespace,
  refreshToken: string,
): Promise<TokenRecord | null> {
  const raw = await kv.get(`refresh:${refreshToken}`);
  if (!raw) return null;
  await kv.delete(`refresh:${refreshToken}`);
  return JSON.parse(raw) as TokenRecord;
}

export async function storeGrant(
  kv: KVNamespace,
  userId: string,
  tokenId: string,
  record: GrantRecord,
): Promise<void> {
  await kv.put(`grant:${userId}:${tokenId}`, JSON.stringify(record), {
    expirationTtl: TOKEN_TTL,
  });
}

export async function loadGrant(
  kv: KVNamespace,
  userId: string,
  tokenId: string,
): Promise<GrantRecord | null> {
  const raw = await kv.get(`grant:${userId}:${tokenId}`);
  if (!raw) return null;
  return JSON.parse(raw) as GrantRecord;
}

export async function revokeGrant(
  kv: KVNamespace,
  userId: string,
  tokenId: string,
): Promise<void> {
  const grant = await loadGrant(kv, userId, tokenId);
  if (grant) {
    await kv.delete(`token:${grant.accessToken}`);
    await kv.delete(`refresh:${grant.refreshToken}`);
  }
  await kv.delete(`grant:${userId}:${tokenId}`);
}

export async function resolveToken(kv: KVNamespace, token: string): Promise<TokenRecord | null> {
  const raw = await kv.get(`token:${token}`);
  if (!raw) return null;
  return JSON.parse(raw) as TokenRecord;
}

export function generateTokenId(): string {
  return crypto.randomUUID();
}
