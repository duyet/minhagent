import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import clerk from '@clerk/astro';

export default defineConfig({
  output: 'static',
  // CSRF protection for form POST endpoints (/api/gateway, /api/oauth/*):
  // Astro 403s cross-origin form submissions to non-prerendered routes.
  // This is the default; pinned so a future default change can't drop it.
  security: {
    checkOrigin: true,
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [clerk()],
});
