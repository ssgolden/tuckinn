import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "187.124.217.8.sslip.io",
      },
      {
        protocol: "https",
        hostname: "**.sslip.io",
      },
    ],
  },
};

export default nextConfig;