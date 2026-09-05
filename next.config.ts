import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['playwright'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

