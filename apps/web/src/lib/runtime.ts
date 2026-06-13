import { env } from 'cloudflare:workers';
import type { KVNamespace } from '@cloudflare/workers-types';

// Astro v6 + @astrojs/cloudflare v13 removed `Astro.locals.runtime.env`.
// Cloudflare bindings are now read from the `cloudflare:workers` virtual module.
export function getOAuthKV(): KVNamespace {
  return env.OAUTH_KV;
}
