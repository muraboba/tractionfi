import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  transpilePackages: ["@tractionfi/engine"],
};

export default nextConfig;
