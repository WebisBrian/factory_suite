import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export 100 % statique (dossier out/) : aucun serveur Node, servi par nginx dans le conteneur.
  output: "export",
  experimental: {
    agentFeedback: true,
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
