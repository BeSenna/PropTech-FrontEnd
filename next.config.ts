import type { NextConfig } from "next";

// O frontend é publicado em http://academico3.rj.senac.br/condominio, ou seja, num subcaminho.
// NEXT_PUBLIC_BASE_PATH precisa existir NO BUILD (o valor é gravado nos arquivos gerados).
//   produção : NEXT_PUBLIC_BASE_PATH=/condominio
//   local    : deixe vazio
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Só para desenvolvimento/testes: faz o papel do gateway, encaminhando NEXT_PUBLIC_API_URL/* para o
// MS Moradores local (que atende em /condominio/morador). Em produção quem faz isso é o gateway.
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "/condominio/gateway/morador";
const apiProxy = process.env.API_PROXY_TARGET; // ex.: http://localhost:7522

const nextConfig: NextConfig = {
  agentRules: false, // não gerar AGENTS.md automaticamente
  basePath,
  // gera a pasta .next/standalone, que roda com `node server.js` (usada no Dockerfile)
  output: "standalone",
  async rewrites() {
    if (!apiProxy) return [];
    return [{ source: `${apiBase}/:path*`, destination: `${apiProxy}/condominio/morador/:path*`, basePath: false }];
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
