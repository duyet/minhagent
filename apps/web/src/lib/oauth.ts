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
  await kv.put(`token:${token}`, JSON.stringify(record), { expirationTtl: 30 * 24 * 60 * 60 });
  await kv.put(`grant:${record.userId}:${record.tokenId}`, token, {
    expirationTtl: 30 * 24 * 60 * 60,
  });
}

export async function resolveToken(kv: KVNamespace, token: string): Promise<TokenRecord | null> {
  const raw = await kv.get(`token:${token}`);
  if (!raw) return null;
  return JSON.parse(raw) as TokenRecord;
}

export function generateTokenId(): string {
  return crypto.randomUUID();
}

export async function grantExists(
  kv: KVNamespace,
  userId: string,
  tokenId: string,
): Promise<boolean> {
  return (await kv.get(`grant:${userId}:${tokenId}`)) !== null;
}

export async function revokeGrant(
  kv: KVNamespace,
  userId: string,
  tokenId: string,
): Promise<void> {
  const grantKey = `grant:${userId}:${tokenId}`;
  const accessToken = await kv.get(grantKey);
  if (accessToken) {
    await kv.delete(`token:${accessToken}`);
  }
  await kv.delete(grantKey);
}
