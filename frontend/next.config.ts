import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API routes are handled by Next.js serverless functions (no proxy needed)
  serverExternalPackages: ['googleapis'],
};

export default nextConfig;
