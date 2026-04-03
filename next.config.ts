import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "secure-truth-production-f59a.up.railway.app" },
    ],
  },
  turbopack: {},
};

export default nextConfig;
