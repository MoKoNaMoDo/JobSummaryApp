import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No proxy needed — API routes run as Next.js serverless functions
  serverExternalPackages: ['googleapis'],
};

export default nextConfig;
