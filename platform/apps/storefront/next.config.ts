import path from "node:path";
import type { NextConfig } from "next";

const apiProxyTarget = process.env.API_PROXY_TARGET;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  async rewrites() {
    if (!apiProxyTarget) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget.replace(/\/$/, "")}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
