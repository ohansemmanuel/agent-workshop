import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // bash-tool / just-bash are server-only and ship binary assets (just-bash
  // bundles a CPython WASM). Keep them out of the webpack bundle so they're
  // required natively at runtime on the Node server — otherwise webpack tries to
  // parse `python.wasm` and the /api/chat route fails to compile.
  serverExternalPackages: ["bash-tool", "just-bash"],
};

export default nextConfig;
