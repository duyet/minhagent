/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    auth: import('@clerk/astro/server').AuthObject;
  }
}

// Cloudflare's `cloudflare:workers` virtual module isn't typed by
// @cloudflare/workers-types; declare the `env` binding we consume.
declare module 'cloudflare:workers' {
  export const env: {
    OAUTH_KV: import('@cloudflare/workers-types').KVNamespace;
    PUBLIC_CLERK_PUBLISHABLE_KEY: string;
    CLERK_SECRET_KEY: string;
  };
}
