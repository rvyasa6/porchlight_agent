import type { NextConfig } from "next";

// Static export for the Chrome extension build: PORCHLIGHT_EXPORT=1 next build
const nextConfig: NextConfig = {
  ...(process.env.PORCHLIGHT_EXPORT ? { output: "export" as const } : {}),
};

export default nextConfig;
