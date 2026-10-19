import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components sind vorerst aus: fast jede Seite liest die Session (ADR 0001).
  cacheComponents: false,
  experimental: {
    // FIT-Upload per Server Action; Vercel begrenzt den Request ohnehin auf 4.5 MB.
    serverActions: { bodySizeLimit: "5mb" },
  },
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
