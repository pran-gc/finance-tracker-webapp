import type { NextConfig } from "next";
import withPWA from "next-pwa";

const withPWAWrapper = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: "/Users/pranav/Desktop/finance-tracker-webapp",
  /* config options here */
};

export default withPWAWrapper(nextConfig);
