import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — produces an `out/` directory of plain HTML/JS for Cloudflare Pages.
  // The API will run as a separate Cloudflare Worker; this app only ships static assets + client JS.
  output: "export",
  images: {
    unoptimized: true,
  },
  // Transpile the local workspace package — Next.js needs this to bundle TS source from outside web/.
  transpilePackages: ["@tractionfi/engine"],
};

export default nextConfig;
