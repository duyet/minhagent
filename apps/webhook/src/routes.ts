/**
 * Event routing configuration.
 *
 * Keys are matched as `${event}.${action}` first, then bare `${event}`.
 * The special key "*" is the wildcard/default — all unmatched events route here.
 *
 * Add specific routes before the wildcard to override behavior per event/action.
 * Example:
 *   "push": { workflow: "github-event" },
 *   "pull_request.opened": { workflow: "github-event" },
 */
export type RouteTarget = {
  workflow: "github-event";
};

export const routes: Record<string, RouteTarget> = {
  // Wildcard: route every event to the github-event workflow.
  // Add specific `event` or `event.action` keys above this to override.
  "*": { workflow: "github-event" },
};

/**
 * Returns the RouteTarget for a given event + action, or null if nothing matched.
 * Lookup order: `${event}.${action}` → `${event}` → `*`
 */
export function resolveRoute(
  event: string,
  action: string | null
): RouteTarget | null {
  if (action) {
    const exact = routes[`${event}.${action}`];
    if (exact) return exact;
  }
  const byEvent = routes[event];
  if (byEvent) return byEvent;
  return routes["*"] ?? null;
}
