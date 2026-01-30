import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Backward compatibility: redirect old /app/* URLs to new /* URLs
      {
        source: '/app/dashboard',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/app/scan/new',
        destination: '/scan/new',
        permanent: true,
      },
      {
        source: '/app/scan/:id*',
        destination: '/scan/:id*',
        permanent: true,
      },
      {
        source: '/app/history',
        destination: '/history',
        permanent: true,
      },
      {
        source: '/app/settings',
        destination: '/settings',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
