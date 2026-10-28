import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export 100 % statique (dossier out/) : aucun serveur Node, servi par nginx dans le conteneur.
  output: "export",
  // Mode dev uniquement : autorise les machines du réseau local à utiliser le serveur de dev
  // (sans ça, la page ne démarre pas quand on l'ouvre par l'IP du PC).
  allowedDevOrigins: ["10.176.139.51", "10.*.*.*", "192.168.*.*"],
  // Conteneur de dev du Hub uniquement (variable définie dans son compose) : depuis Windows, les
  // changements de fichiers ne traversent pas le volume Docker, on les scrute. Sans la variable : rien.
  ...(process.env.FACTORY_DEV_POLLING && {
    watchOptions: { pollIntervalMs: Number(process.env.FACTORY_DEV_POLLING) },
  }),
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
