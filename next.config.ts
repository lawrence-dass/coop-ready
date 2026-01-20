import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: cacheComponents temporarily disabled due to incompatibility with dynamic routes [scanId]
  // See Story 3.6 - will re-enable after migrating to non-dynamic approach or Next.js fix
  // TODO: Track this issue - when Next.js 16+ supports dynamic routes with cacheComponents, re-enable
  // Related: https://github.com/vercel/next.js/discussions (search for cacheComponents + dynamic routes)
  cacheComponents: false,
  // Use turbopack config for Next.js 16
  turbopack: {},
  // Externalize problematic server packages
  serverExternalPackages: ['pdf-parse'],
}

export default nextConfig;
