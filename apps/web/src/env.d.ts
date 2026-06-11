/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type KVNamespace = import('@cloudflare/workers-types').KVNamespace;

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        OAUTH_KV: KVNamespace;
        PUBLIC_CLERK_PUBLISHABLE_KEY: string;
        CLERK_SECRET_KEY: string;
        ASSETS: unknown;
      };
      cfContext: import('@cloudflare/workers-types').ExecutionContext;
    };
    auth: import('@clerk/astro/server').AuthObject;
  }
}
