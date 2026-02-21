import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:5001/api/:path*", // Proxy to Backend (Port 5001)
      },
    ];
  },
};

export default nextConfig;
