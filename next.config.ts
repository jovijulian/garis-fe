import type { NextConfig } from "next";
const buildId = Date.now().toString();
const nextConfig: NextConfig = {
  /* config options here */
  generateEtags: false,
  generateBuildId: async () => {
    // Bisa pakai commit hash atau timestamp
    return `build-${Date.now()}`;
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  env: {
    NEXT_PUBLIC_APP_BUILD_ID: buildId,
    BASE_URL: "https://api-garis.cisangkan.co.id/api/v1/",
    IMAGE_URL: "https://api-garis.cisangkan.co.id/",
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
