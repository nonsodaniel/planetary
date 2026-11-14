import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.nvidia.com" },
      { protocol: "https", hostname: "**.cala.ai" },
    ],
  },
};

export default nextConfig;
