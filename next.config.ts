import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components sind vorerst aus: fast jede Seite liest die Session (ADR 0001).
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
