import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Use turbopack config for Next.js 16
  turbopack: {},
  // Externalize problematic server packages
  serverExternalPackages: ['pdf-parse'],
}

export default nextConfig;
