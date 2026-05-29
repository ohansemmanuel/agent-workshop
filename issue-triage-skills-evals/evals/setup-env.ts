/**
 * Load the OpenAI key (and any OPENAI_* dials) from .env.local into process.env
 * BEFORE the agent module reads them. Imported FIRST in every .eval.ts file.
 *
 * Why this exists: evalite runs on Vitest/Vite, which only exposes VITE_-prefixed
 * vars to `import.meta.env` — it does NOT populate `process.env` from .env.local.
 * The agent (and the OpenAI provider) read `process.env`, so we load it here.
 *
 * dotenv does NOT override vars already set in the environment, so
 * `OPENAI_REASONING_EFFORT=minimal npm run eval:run` still wins over .env.local —
 * which is exactly how you flip the robust→drift A/B (see evals/README.md).
 */
import { config } from "dotenv";

config({ path: ".env.local" });
