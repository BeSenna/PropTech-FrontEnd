# PropTech — Frontend

Interface web do **Gestor de Manutenção de Condomínios** (Projeto Integrador — Senac RJ). Tem duas áreas no mesmo site:

- **Painel do síndico** — cadastros (blocos, imóveis, moradores, relações, usuários), financeiro e serviços.
- **Portal do Morador** — o morador vê o próprio imóvel, cobranças, reservas, ocorrências e avisos.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4. O visual vem do protótipo do Figma (desktop 1440).

---

## Sumário

1. [Como o sistema se encaixa](#1-como-o-sistema-se-encaixa)
2. [O que é real e o que é simulado](#2-o-que-é-real-e-o-que-é-simulado)
3. [Rodar na sua máquina (passo a passo)](#3-rodar-na-sua-máquina-passo-a-passo)
4. [Variáveis de ambiente](#4-variáveis-de-ambiente)
5. [Como testar (roteiro de 5 minutos)](#5-como-testar-roteiro-de-5-minutos)
6. [Rodar com Docker](#6-rodar-com-docker)
7. [Publicar no servidor (Jenkins)](#7-publicar-no-servidor-jenkins)
8. [Comandos úteis](#8-comandos-úteis)
9. [Estrutura do código](#9-estrutura-do-código)
10. [Como funciona por dentro](#10-como-funciona-por-dentro)
11. [Problemas comuns](#11-problemas-comuns)

---

## 1. Como o sistema se encaixa

O frontend **não fala direto** com o backend. Toda chamada à API passa pelo **gateway** do projeto:

```
Navegador
   │  http://academico3.rj.senac.br/condominio ............ este frontend  (porta 7520)
   │
   └─► /condominio/gateway/morador/...  ──► Gateway (7521) ──► MS Moradores (7522)
                                                               /condominio/morador/...
```

- O site é publicado num **subcaminho** (`/condominio`), por isso existe a variável `NEXT_PUBLIC_BASE_PATH`.
- O navegador chama um caminho **relativo** (`/condominio/gateway/morador`), no mesmo endereço do site: por isso não há problema de CORS.
- O **gateway** precisa repassar o header `Authorization`, os métodos `PATCH`/`DELETE` e os corpos de erro (400/401/403) **sem alterar**. Se ele não fizer isso, o front falha em produção mesmo estando tudo certo no código.

Repositórios do projeto:
[Backend — MS Moradores](https://github.com/BeSenna/Moradores-Proptech) (branch `feat/prisma-7`) · este frontend.

## 2. O que é real e o que é simulado

| Módulo | De onde vêm os dados |
|---|---|
| Login, Blocos, Imóveis, Moradores, Relação (vínculos), Usuários | **API real** — MS Moradores, via gateway |
| Portal do Morador → "Meu Imóvel" | **API real** |
| Financeiro (cobranças, pagamentos, despesas, receitas) | **Simulado** — guardado no `localStorage` do navegador |
| Serviços (áreas comuns, reservas, ocorrências, manutenções, avisos) | **Simulado** — guardado no `localStorage` do navegador |

Os microsserviços de Financeiro e Serviços ainda não existem. Telas simuladas mostram a etiqueta **DADOS SIMULADOS**. Os dados simulados ficam só no seu navegador: não vão para o banco e cada pessoa vê os seus. Quando esses serviços existirem, trocar o mock pela API não muda nenhuma tela (ver [seção 9](#9-estrutura-do-código)).

---

## 3. Rodar na sua máquina (passo a passo)

### Pré-requisitos

- **Node.js 20.9 ou mais novo** (o projeto foi testado com 22). Confira: `node -v`.
- **Git**.
- O **MS Moradores rodando** na porta **7522** (veja o README do backend). Sem ele, o login não funciona.

### Passo 1 — Suba o backend

No repositório do backend (outro terminal):

```bash
npx nest start
```

Espere aparecer `MS Moradores rodando em http://localhost:7522/condominio/morador`. Anote a senha do síndico (`ADMIN_SENHA` do `.env` do backend).

### Passo 2 — Baixe e instale o frontend

```bash
git clone https://github.com/BeSenna/PropTech-FrontEnd.git
cd PropTech-FrontEnd
npm install
```

### Passo 3 — Crie o arquivo de configuração local

```bash
cp .env.example .env.local
```

O `.env.local` já vem pronto para desenvolvimento (veja [Variáveis de ambiente](#4-variáveis-de-ambiente)). Esse arquivo **não vai para o Git**.

### Passo 4 — Rode

```bash
npm run dev
```

Abra <http://localhost:3000/login>.

> Em desenvolvimento, o próprio Next.js faz o papel do gateway: ele encaminha `/condominio/gateway/morador/*` para o backend em `http://localhost:7522` (variável `API_PROXY_TARGET`). Por isso o backend tem que estar no ar.

### Passo 5 — Entre

Escolha o botão do seu perfil e informe o usuário e a senha:

- **Síndico:** usuário `admin` e a `ADMIN_SENHA` do backend → botão **Entrar como Síndico(a)**.
- **Morador:** a conta criada pelo síndico (veja a [seção 5](#5-como-testar-roteiro-de-5-minutos)) → botão **Entrar como Morador**.

O botão precisa corresponder ao perfil da conta. Se não corresponder, aparece "Esta conta é de síndico(a). Use o botão…".

---

## 4. Variáveis de ambiente

O frontend **não tem segredos**. As variáveis `NEXT_PUBLIC_*` são gravadas no JavaScript que o navegador baixa, então qualquer pessoa pode vê-las. **Não use o Infisical para o frontend** e nunca coloque senha ou token nele.

| Variável | Para que serve | Desenvolvimento | Produção |
|---|---|---|---|
| `NEXT_PUBLIC_BASE_PATH` | Subcaminho onde o site é publicado | vazio | `/condominio` |
| `NEXT_PUBLIC_API_URL` | Base da API **como o navegador a enxerga** (via gateway) | `/condominio/gateway/morador` | `/condominio/gateway/morador` |
| `API_PROXY_TARGET` | Só no `npm run dev`: endereço do backend para onde o Next encaminha as chamadas | `http://localhost:7522` | *(não usar)* |

Duas regras importantes:

1. **`NEXT_PUBLIC_*` são lidas no build.** Se mudar o valor, é preciso gerar o build de novo (`npm run dev` reinicia sozinho; no Docker, rode `docker compose up -d --build`).
2. **Com `NEXT_PUBLIC_BASE_PATH=/condominio`, o site passa a responder em `/condominio/...`** (por exemplo `http://localhost:3000/condominio/login`). Em desenvolvimento deixe vazio para usar `http://localhost:3000/login`.

Em produção, quem define essas variáveis é o pipeline do Jenkins (veja a [seção 7](#7-publicar-no-servidor-jenkins)), e não um arquivo `.env`.

---

## 5. Como testar (roteiro de 5 minutos)

Com o backend e o frontend no ar:

1. Entre como **síndico**.
2. **Blocos → Novo:** crie um bloco (ex.: "Bloco A").
3. **Imóveis → Novo:** crie um imóvel no bloco (ex.: apartamento 101).
4. **Moradores → Novo:** cadastre um morador. O **CPF precisa ser válido**: o formulário confere os dígitos verificadores, e o backend também.
   - Use, por exemplo, `529.982.247-25` (válido).
   - `111.111.111-11` e `529.982.247-24` são recusados.
5. **Relação → Nova relação:** ligue o morador ao imóvel (tipo Proprietário, data de início) e ative **"Conceder acesso ao Portal do Morador"**. Informe um login e uma senha de 8+ caracteres. Isso cria a conta do morador já vinculada.
6. Saia (botão **Sair**, no canto inferior do menu lateral) e entre com essa conta pelo botão **Entrar como Morador**.
7. No portal, abra **Meu Imóvel**: deve aparecer o imóvel que você vinculou.
8. Como morador, tente abrir uma URL do painel do síndico (ex.: `/blocos`): você é redirecionado. O morador só enxerga os próprios dados.

Para **zerar os dados simulados** (Financeiro/Serviços), abra o console do navegador (F12) e rode:
```js
Object.keys(localStorage).filter(k => k.startsWith('proptech.mock.')).forEach(k => localStorage.removeItem(k))
```

---

## 6. Rodar com Docker

Útil para conferir se a imagem gera e sobe, como acontece no servidor.

```bash
docker compose up -d --build
```

- O site responde em <http://localhost:7520/login> (com o `BASE_PATH` vazio).
- Para simular o servidor, que usa o subcaminho:
  ```bash
  NEXT_PUBLIC_BASE_PATH=/condominio docker compose up -d --build
  ```
  e abra <http://localhost:7520/condominio/login>.
- Para parar e remover: `docker compose down`.

**Limitação:** a imagem Docker **não tem o proxy de desenvolvimento**. Sem o gateway no ar, o login pelo container falha com erro de conexão, e isso não é defeito do front. Para testar o fluxo completo na sua máquina, use o `npm run dev` (seção 3).

> Não rode esse comando com `npx infisical run ...`: o frontend não está ligado a nenhum projeto do Infisical e também não precisa de segredos. O erro `Please either run infisical init to connect to a project…` aparece por esse motivo.

---

## 7. Publicar no servidor (Jenkins)

O repositório tem **dois pipelines com o mesmo fluxo**:

| Arquivo | Agente | Comandos |
|---|---|---|
| `JenkinsfileLinux` | Linux — **é o usado no servidor** | `sh` |
| `Jenkinsfile` | Windows | `bat` |

### O que o administrador do Jenkins precisa configurar

1. Criar um job do tipo **Pipeline**, com definição **"Pipeline script from SCM"** (Git).
2. **Repositório:** `https://github.com/BeSenna/PropTech-FrontEnd` · **Branch:** `*/main`.
3. **Script Path:** `JenkinsfileLinux` (o padrão do Jenkins é `Jenkinsfile`, que é a versão Windows).
4. **Não é preciso criar credencial nenhuma** (o front não tem segredos).
5. Rodar **"Construir agora"**.

### O que o pipeline faz

1. Baixa o código da branch `main`.
2. `docker compose config` — valida o `docker-compose.yml`.
3. `docker compose build` — gera a imagem (aqui as variáveis `NEXT_PUBLIC_*` são gravadas).
4. `docker compose up -d --force-recreate` — sobe o container `proptech-frontend` na porta **7520**.
5. Confere se o container está rodando e se `/condominio/login` responde.

No Console Output, procure: `Container em execução.` e `Frontend respondendo.`. Se a última etapa ficar **amarela**, o container subiu mas a página não respondeu a tempo: veja o `docker logs` que aparece no fim do log.

As variáveis (`NEXT_PUBLIC_BASE_PATH=/condominio` e `NEXT_PUBLIC_API_URL=/condominio/gateway/morador`) ficam no bloco `environment { }` do pipeline. Para mudar, edite o `Jenkinsfile`/`JenkinsfileLinux`, faça o push e rode o job de novo.

### Conferindo depois do deploy

1. Abra <http://academico3.rj.senac.br/condominio/login>.
2. Entre como síndico e navegue pelos cadastros.
3. Se o login falhar com erro de conexão ou 404, o problema está no **gateway** ou no backend, não no front. Confira com o grupo se o gateway aponta para o MS Moradores (porta 7522) e se repassa `Authorization`, `PATCH`/`DELETE` e os corpos de erro sem alterar.

---

## 8. Comandos úteis

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências |
| `npm run dev` | Servidor de desenvolvimento (porta 3000, recarrega sozinho) |
| `npm run build` | Gera o build de produção |
| `npm start` | Roda o build de produção (porta 7520) |
| `npm run lint` | Verifica o estilo do código |
| `npm run typecheck` | Verifica os tipos do TypeScript |
| `docker compose up -d --build` | Gera a imagem e sobe o container (porta 7520) |
| `docker compose down` | Para e remove o container |

---

## 9. Estrutura do código

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
    resource/              ResourceList / Form / Detail (genéricos, guiados por configuração)
    pages/                 Login, Overviews, Portal
  lib/                     http (fetch + erros + JWT), format (CPF, datas), types
  mock/                    store (localStorage) + dados de demonstração
  resources/               moradores.tsx (API real) · simulados.tsx (mock) · api.ts · index.ts
```

**Como as telas nascem:** as telas de lista, novo, detalhe e editar são **genéricas**. Cada recurso (bloco, imóvel, morador…) é descrito por uma configuração (`ResourceConfig`): campos, colunas, filtros e como converter o formulário em dados da API.

**Para adicionar um recurso novo:**
1. Crie o `ResourceConfig` em `src/resources/`.
2. Inclua em `RESOURCES` (`src/resources/index.ts`).
3. As quatro telas aparecem sozinhas nas rotas `[recurso]`.

**Trocar um mock pela API real:** os mocks e a API usam a mesma interface (`Adapter`, em `src/resources/api.ts` e `src/mock/store.ts`). Troque o adaptador do recurso e nenhuma tela precisa mudar.

---

## 10. Como funciona por dentro

- **Sessão:** o login devolve um JWT, guardado no `localStorage` (`proptech.token`). A sessão é revalidada em `/auth/me`.
- **Erro 401:** qualquer resposta 401 (token vencido ou usuário desativado — o backend consulta o banco a cada requisição) encerra a sessão e volta ao login.
- **Guarda de perfil:** as áreas do síndico e do morador só renderizam depois de a sessão ser lida no navegador (por isso não há erro de hidratação). Um perfil não acessa a área do outro.
- **Privacidade (LGPD):** no backend, a lista de moradores e a de relações são só do síndico. O Portal do Morador lê apenas o **próprio** cadastro (`GET /morador/:id` com o `moradorId` da sessão); qualquer outro id devolve 403.
- **CPF:** o formulário confere os dígitos verificadores antes de enviar (`cpfValido`, em `src/lib/format.ts`, mesma regra do backend). Se estiver errado, o aviso aparece e nada é enviado à API.
- **Validação própria por campo:** `validate` em `FieldDef` (`src/lib/types.ts`) roda antes do envio; a mensagem aparece no topo do formulário.
- **Editar com campos vazios:** ao salvar uma edição com e-mail, telefone ou data limpos, o front envia `null`, e o backend limpa o campo.
- **Fonte:** a Inter vem do Google Fonts; sem internet o navegador usa a fonte do sistema.

---

## 11. Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Login: "Não foi possível falar com a API. Verifique se o MS Moradores está rodando." (em `npm run dev`) | Backend desligado, ou `API_PROXY_TARGET` ausente no `.env.local` | Suba o backend (`npx nest start`) e confira `API_PROXY_TARGET=http://localhost:7522`; reinicie o `npm run dev` |
| Login: "Login ou senha inválidos" | Usuário ou senha errados | Use `admin` e a `ADMIN_SENHA` do backend. O síndico só é criado se ainda não existir um |
| "Esta conta é de síndico(a). Use o botão…" | Botão do perfil errado | Use "Entrar como Síndico(a)" ou "Entrar como Morador" conforme a conta |
| "Esta conta ainda não está vinculada a um morador" (portal) | A conta foi criada sem relação | O síndico cria o acesso em **Relação → Nova relação → Conceder acesso**, ou vincula a conta a uma relação |
| "CPF inválido" ao cadastrar | CPF com dígito verificador errado | Use um CPF válido, ex.: `529.982.247-25` |
| `http://localhost:3000/login` dá 404 | `NEXT_PUBLIC_BASE_PATH=/condominio` no `.env.local` | Deixe vazio (ou acesse `/condominio/login`) e reinicie o `npm run dev` |
| Mudei uma variável `NEXT_PUBLIC_*` e nada mudou | Elas são lidas no build | Reinicie o `npm run dev` ou rode `docker compose up -d --build` |
| `port is already allocated` / `EADDRINUSE` | Porta 3000 (dev) ou 7520 (Docker) ocupada | Veja quem usa: `ss -ltnp \| grep 7520`; pare o processo ou o container (`docker ps`, `docker stop NOME`) |
| `Please either run infisical init…` ao subir o Docker | Foi usado `npx infisical run` — o front não usa Infisical | Rode só `docker compose up -d --build` |
| Container sobe, mas o login mostra "Não foi possível falar com a API" | A imagem não tem o proxy de desenvolvimento; o gateway não está acessível | Em teste local use `npm run dev`; em produção confira o gateway |
| Em produção: 401 após o login, ou PATCH/DELETE falham | O gateway não repassa `Authorization` ou bloqueia os métodos | Corrija no gateway (veja a [seção 1](#1-como-o-sistema-se-encaixa)) |
| Mensagens de erro da API não aparecem | O gateway troca o corpo das respostas de erro | O gateway precisa repassar os corpos 400/401/403 sem alterar |
| Dados do Financeiro/Serviços sumiram | São simulados e ficam no navegador | Normal ao trocar de navegador ou limpar os dados do site |
| Tela sem a fonte Inter | Sem acesso ao Google Fonts | Sem problema: o navegador usa a fonte do sistema |