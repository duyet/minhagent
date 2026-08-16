/**
 * Eve-shaped root config. The thin Cloudflare worker does not run `eve`
 * (Vercel Workflow / Nitro). `createMinhAgent` reads these fields.
 */
export const MAX_OUTPUT_TOKENS = 2048
export const MAX_STEPS = 8

export default {
  model: "anyrouter/free",
  maxOutputTokens: MAX_OUTPUT_TOKENS,
  stopWhenSteps: MAX_STEPS,
}
