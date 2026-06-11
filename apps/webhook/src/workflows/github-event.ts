import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import type { Env, GitHubEventParams } from "../types";

/**
 * GitHubEventWorkflow — placeholder workflow that logs incoming GitHub events.
 *
 * Each delivery is created with the GitHub delivery GUID as the instance id,
 * which provides natural idempotency: duplicate deliveries will fail to create
 * a second instance with the same id and are silently dropped in src/index.ts.
 *
 * Future: add per-event/action steps here (e.g. update PR status, trigger CI).
 */
export class GitHubEventWorkflow extends WorkflowEntrypoint<
  Env,
  GitHubEventParams
> {
  async run(
    event: WorkflowEvent<GitHubEventParams>,
    step: WorkflowStep
  ): Promise<void> {
    await step.do("log-event", async () => {
      const { deliveryId, event: ghEvent, action, payloadSummary } =
        event.payload;

      console.log(
        JSON.stringify({
          level: "info",
          workflow: "github-event",
          instanceId: event.instanceId,
          deliveryId,
          event: ghEvent,
          action,
          repo: payloadSummary.repo,
          sender: payloadSummary.sender,
          installation: payloadSummary.installation,
          ts: event.timestamp,
        })
      );

      return { logged: true };
    });
  }
}
