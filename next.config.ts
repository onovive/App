import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Optimize production build
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
};

export default nextConfig;
