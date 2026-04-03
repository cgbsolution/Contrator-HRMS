import type { NextConfig } from "next";
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost", "secure-truth-production-f59a.up.railway.app"],
  },
};

module.exports = withPWA(nextConfig);
