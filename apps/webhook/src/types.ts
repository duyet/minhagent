/**
 * Shared types for the minhagent webhook worker.
 *
 * NOTE: The Env interface below is hand-written for bootstrapping.
 * Regenerate it from your actual wrangler.jsonc bindings by running:
 *   bun run types   (which runs: wrangler types)
 * The generated file will be placed at worker-configuration.d.ts and
 * should replace this hand-written interface once it exists.
 */

export interface Env {
  /** GitHub App webhook secret — set via: wrangler secret put GITHUB_WEBHOOK_SECRET */
  GITHUB_WEBHOOK_SECRET: string;
  /** Cloudflare Workflows binding for processing GitHub events */
  GITHUB_EVENT_WORKFLOW: Workflow;
}

/** Parameters passed to the GitHubEventWorkflow workflow instance. */
export interface GitHubEventParams {
  event: string;
  action: string | null;
  deliveryId: string;
  payloadSummary: {
    repo: string | null;
    sender: string | null;
    installation: number | null;
  };
}
