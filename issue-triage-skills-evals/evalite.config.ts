import { defineConfig } from "evalite/config";

export default defineConfig({
  // Each case runs the REAL agent (pick a runbook → skill() to load it → maybe
  // bash-grep incidents → compose) on a reasoning model. 30–60s+ per case is
  // normal; evalite's default 30s timeout would fail the slow ones. Give them room.
  testTimeout: 180_000,

  // Run a few cases at a time — full parallelism can trip OpenAI rate limits and
  // makes individual cases slower (more likely to time out).
  maxConcurrency: 3,

  // Optional CI gate: uncomment to make `evalite run` exit non-zero if the average
  // score drops below this. Left off so the demo can SHOW failures without erroring.
  // scoreThreshold: 80,
  // Optional CI gate: uncomment to run each case multiple times, then average the
  // scores. This helps with noisy data and can make evalite more reliable. Left
  // off so the demo can show a single trial's results without averaging.
  // trialCount: 5
});
