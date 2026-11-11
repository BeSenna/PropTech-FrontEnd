import type { NextConfig } from "next";

// O frontend é publicado em http://academico3.rj.senac.br/condominio, ou seja, num subcaminho.
// NEXT_PUBLIC_BASE_PATH precisa existir NO BUILD (o valor é gravado nos arquivos gerados).
//   produção : NEXT_PUBLIC_BASE_PATH=/condominio
//   local    : deixe vazio
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Só para desenvolvimento/testes: faz o papel do gateway, encaminhando NEXT_PUBLIC_API_URL/* para o
// MS Moradores local (que atende em /condominio/morador) e NEXT_PUBLIC_FINANCEIRO_API_URL/* para o
// MS Financeiro local (/condominio/financeiro). Em produção quem faz isso é o gateway.
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "/condominio/gateway/morador";
const apiProxy = process.env.API_PROXY_TARGET; // ex.: http://localhost:7522
const finBase = process.env.NEXT_PUBLIC_FINANCEIRO_API_URL ?? "/condominio/gateway/financeiro";
const finProxy = process.env.FINANCEIRO_PROXY_TARGET; // ex.: http://localhost:7523

const nextConfig: NextConfig = {
  agentRules: false, // não gerar AGENTS.md automaticamente
  basePath,
  // gera a pasta .next/standalone, que roda com `node server.js` (usada no Dockerfile)
  output: "standalone",
  async rewrites() {
    // O servidor da faculdade RETIRA o subcaminho antes de repassar ao container (é o que faz com /condominio/morador no
    // backend): o navegador pede /condominio/login e o container recebe /login. Com basePath, o Next responderia 404
    // a qualquer caminho sem o prefixo. Estas regras (rodam antes de páginas e arquivos estáticos) devolvem o prefixo,
    // então o site abre com ou sem proxy retirando o subcaminho. Não afetam quem já chega com /condominio.
    // (O Next só aceita reescrever fora do basePath para uma URL absoluta, por isso o destino é o próprio servidor,
    // na porta do container: 7520, a mesma do Dockerfile.)
    const sub = basePath.replace(/^\//, "");
    const self = `http://127.0.0.1:${process.env.PORT ?? 7520}${basePath}`;
    const devolvePrefixo = basePath
      ? [
          { source: "/", destination: self, basePath: false as const },
          { source: `/:resto((?!${sub}(?:/|$)).+)`, destination: `${self}/:resto`, basePath: false as const },
        ]
      : [];
    return {
      beforeFiles: devolvePrefixo,
      afterFiles: [
        ...(apiProxy ? [{ source: `${apiBase}/:path*`, destination: `${apiProxy}/condominio/morador/:path*`, basePath: false as const }] : []),
        ...(finProxy ? [{ source: `${finBase}/:path*`, destination: `${finProxy}/condominio/financeiro/:path*`, basePath: false as const }] : []),
      ],
      fallback: [],
    };
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
