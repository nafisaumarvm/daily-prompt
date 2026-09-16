import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow server-side fetches to local/private Ulanzi IPs in production
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
};

export default nextConfig;
