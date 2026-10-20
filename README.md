# PropTech — Frontend (React 19 + Vite + TypeScript)

Interface web do **Gestor de Manutenção de Condomínios**, construída a partir do protótipo de alta fidelidade no Figma (desktop 1440).
Cobre o painel do síndico e o Portal do Morador.

| Módulo | Origem dos dados |
|---|---|
| Login, Blocos, Imóveis, Moradores, Relação (vínculos), Usuários | **API real** do MS Moradores (`/api`) |
| Financeiro (cobranças, pagamentos, despesas, receitas) | **Simulado** no navegador (localStorage) |
| Serviços (áreas comuns, reservas, ocorrências, manutenções, avisos) | **Simulado** no navegador (localStorage) |
| Portal do Morador | “Meu Imóvel” vem da API; o resto usa os dados simulados |

> Os módulos simulados existem porque os microsserviços Financeiro e Serviços ainda não foram implementados. Eles usam a mesma interface (`Adapter`) da API real, então trocar por chamadas HTTP depois não muda nenhuma tela — ver [`src/mock/store.ts`](src/mock/store.ts) e [`src/resources/api.ts`](src/resources/api.ts). Telas simuladas exibem a etiqueta **DADOS SIMULADOS**.

## Como rodar

Pré-requisitos: Node 20+ e o MS Moradores rodando (ex.: `docker compose up --build` no repositório do backend, porta **3001**).

```bash
npm install
npm run dev          # http://localhost:5173
```

O Vite encaminha `/api` para `http://localhost:3001` (sem problemas de CORS). Para apontar para outro backend:

```bash
VITE_API_PROXY=http://meu-servidor:3001 npm run dev      # desenvolvimento
VITE_API_URL=https://meu-dominio.com/api npm run build   # produção (URL absoluta da API)
```

Outros comandos: `npm run build` (typecheck + build em `dist/`), `npm run preview`, `npm run typecheck`.

## Acessos

- **Síndico:** o usuário criado automaticamente pelo backend (`ADMIN_LOGIN` / `ADMIN_SENHA` do `.env` do MS Moradores).
- **Morador:** crie em **Relação → Nova relação → “Conceder acesso ao Portal do Morador”** (cria o usuário já ligado ao vínculo) ou em **Usuários**.
- O botão usado no login precisa corresponder ao perfil da conta (como no Figma: “Entrar como Síndico(a)” / “Entrar como Morador”).

## O que está implementado

- Login com JWT; sessão revalidada em `/auth/me`; qualquer `401` (inclusive usuário desativado, já que o backend consulta o banco a cada requisição) encerra a sessão.
- Rotas protegidas por perfil: síndico → painel; morador → `/portal`.
- Listas com busca, chips de filtro com contagem, ordenação por coluna, paginação e filtros via URL (`/imoveis?blocoId=1`).
- Moradores com colunas Imóvel / Bloco / **Relação** e filtros por tipo de relação.
- Formulários com validação e exibição das mensagens da API (CPF inválido, nome duplicado etc.), selects de FK carregados da API.
- Detalhes com painel de relacionados; desativação com confirmação (soft delete, como no backend); encerramento de vínculo.
- Responsivo básico e navegação por teclado nas linhas das tabelas.

## Estrutura

```
src/
  auth/          AuthContext (JWT, sessão)
  components/    ui, Toast, Modal
  lib/           http (fetch + erros), format, types
  mock/          store (localStorage) + dados de demonstração
  resources/     moradores.tsx (API real) · simulados.tsx · api.ts
  pages/         Layouts, Login, Overviews, Resource{List,Form,Detail}, Portal
```

Cada recurso é descrito por um objeto `ResourceConfig` (colunas, campos, filtros, detalhe); as telas de lista/formulário/detalhe são genéricas. Para adicionar um módulo, crie o config e registre-o em `src/App.tsx`.

## Limitações conhecidas

- Financeiro/Serviços não persistem no servidor (ficam no navegador de quem usa).
- O contador “Avisos” do portal mostra avisos **ativos** (não há controle de leitura).
- A tela “Usuários” não existe no Figma; foi adicionada porque a API a oferece.
