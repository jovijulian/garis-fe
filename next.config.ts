import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  env: {
    BASE_URL: "https://booking-be-v49x.vercel.app/api/v1/",
    IMAGE_URL: "https://f38qmrhd9kdkwje8.public.blob.vercel-storage.com/",

  },
  experimental: {
    optimizePackageImports: [
      "@mantine/core",
      "@mantine/hooks",
      "@mantine/emotion",
      "@mantine/form",
    ],
  },
};

export default nextConfig;
