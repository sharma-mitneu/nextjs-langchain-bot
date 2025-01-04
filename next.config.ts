import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone", // Use standalone output for deployment
  trailingSlash: false // Clean URLs without trailing slashes
};

export default nextConfig;
