import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["artifact-hub.onrender.com"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
