# PropTech — Frontend (Next.js 16 + Tailwind CSS 4)

Interface web do **Gestor de Manutenção de Condomínios** (painel do síndico + Portal do Morador), a partir do protótipo de alta fidelidade do Figma (desktop 1440).

Stack: **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS 4** (tokens do Figma em `@theme`, em `src/app/globals.css`).

| Módulo | Origem dos dados |
|---|---|
| Login, Blocos, Imóveis, Moradores, Relação (vínculos), Usuários | **API real** — MS Moradores (via gateway: `/condominio/gateway/morador`) |
| Financeiro (cobranças, pagamentos, despesas, receitas) | **Mock** no navegador (localStorage) |
| Serviços (áreas comuns, reservas, ocorrências, manutenções, avisos) | **Mock** no navegador (localStorage) |
| Portal do Morador | “Meu Imóvel” vem da API; o resto usa os mocks |

Os microsserviços de Financeiro e Serviços ainda não existem; os mocks usam a mesma interface (`Adapter`) da API real, então trocar por HTTP depois não muda nenhuma tela — ver `src/mock/store.ts` e `src/resources/api.ts`. Telas mockadas exibem a etiqueta **DADOS SIMULADOS**.

## Configuração (variáveis de ambiente)

Copie `.env.example` → `.env.local` para desenvolvimento. Em produção os valores vêm do **Infisical**.

| Variável | Para quê | Quando é lida |
|---|---|---|
| `NEXT_PUBLIC_BASE_PATH` | Subcaminho onde o site é publicado. Produção: `/condominio`. Dev: vazio. | **build** |
| `NEXT_PUBLIC_API_URL` | Base da API do MS Moradores **vista pelo navegador** (via gateway). Padrão `/condominio/gateway/morador` (gateway `http://academico3.rj.senac.br/condominio/gateway` + rota `/morador`). | **build** |
| `API_PROXY_TARGET` | Só dev: `next dev` faz o papel do gateway e encaminha `NEXT_PUBLIC_API_URL/*` para esse endereço (ex.: `http://localhost:7522`), sem CORS. | build/dev |

> `NEXT_PUBLIC_*` são gravadas nos arquivos gerados: mudou o valor, rode o build de novo.

## Rodar em desenvolvimento

Pré-requisitos: Node 20.9+ e o MS Moradores no ar (porta 7522).

```bash
npm install
cp .env.example .env.local     # ajuste NEXT_PUBLIC_BASE_PATH= (vazio) para dev
npm run dev                    # http://localhost:3000
```

## Produção (Docker, porta 7520)

```bash
npx infisical run --env=dev -- docker compose up -d --build
# ou, sem Infisical:
NEXT_PUBLIC_BASE_PATH=/condominio NEXT_PUBLIC_API_URL=/condominio/gateway/morador docker compose up -d --build
```

A imagem usa `output: 'standalone'` (`node server.js`, usuário não-root). O site responde em `http://<host>:7520/condominio/...`.

Fluxo esperado em produção: navegador → proxy da Senac → `/condominio` (frontend, 7520) e `/condominio/gateway` (gateway, 7521) → `/morador/*` repassado ao MS Moradores (7522, `/condominio/morador/*`). O gateway precisa repassar o header `Authorization`, os métodos PATCH/DELETE e os corpos de erro (401/400) sem alterar.

Outros comandos: `npm run build`, `npm run lint`, `npm run typecheck`.

## Acessos

- **Síndico:** usuário criado pelo backend (`ADMIN_LOGIN` / `ADMIN_SENHA` do MS Moradores).
- **Morador:** em **Relação → Nova relação → “Conceder acesso ao Portal do Morador”** (cria o usuário já ligado ao vínculo) ou em **Usuários**.
- O botão do login precisa corresponder ao perfil da conta (“Entrar como Síndico(a)” / “Entrar como Morador”).

## Estrutura

```
src/
  app/                     rotas (App Router)
    login/                 /login
    (sindico)/             painel do síndico (layout com guarda de perfil)
      page.tsx             dashboard
      cadastros|financeiro|servicos/   visões gerais
      [recurso]/           lista · novo · [id] · [id]/editar (blocos, imoveis, moradores, ...)
    portal/                Portal do Morador (layout com guarda de perfil)
  auth/                    AuthContext (JWT, sessão revalidada em /auth/me)
  components/
    ui.tsx                 peças visuais + classes Tailwind compartilhadas (btn, input…)
    layouts/               SindicoShell, PortalShell, RequireRole
    resource/              ResourceList / Form / Detail (genéricos, guiados por config)
    pages/                 Login, Overviews, Portal
  lib/                     http (fetch + erros + JWT), format, types
  mock/                    store (localStorage) + dados de demonstração
  resources/               moradores.tsx (API real) · simulados.tsx (mock) · api.ts · index.ts
```

Para adicionar um recurso novo: crie o `ResourceConfig` em `src/resources/` e inclua em `RESOURCES` (`src/resources/index.ts`) — as quatro telas (lista, novo, detalhe, editar) saem das rotas `[recurso]`.

## Notas de implementação

- Todas as telas são componentes de cliente: dependem de `localStorage` (JWT/mocks) e a guarda de perfil só renderiza o conteúdo depois de a sessão ser lida no navegador (sem erro de hidratação).
- `401` em qualquer chamada (inclusive usuário desativado — o backend consulta o banco a cada requisição) encerra a sessão.
- A fonte Inter vem do Google Fonts; sem internet o navegador usa a fonte do sistema.
