// Cliente HTTP dos microsserviços: injeta o JWT (emitido pelo MS Moradores) e padroniza erros do NestJS.
//
// As variáveis NEXT_PUBLIC_* são gravadas no build. Exemplos:
//   produção (padrão): /condominio/gateway/morador e /condominio/gateway/financeiro  → gateway
//                       http://academico3.rj.senac.br/condominio/gateway; relativo = mesma origem, sem CORS
//   dev               : os mesmos valores; o next.config.ts encaminha para API_PROXY_TARGET (MS Moradores local)
//                       e FINANCEIRO_PROXY_TARGET (MS Financeiro local)
const BASES = {
  morador: process.env.NEXT_PUBLIC_API_URL ?? "/condominio/gateway/morador",
  financeiro: process.env.NEXT_PUBLIC_FINANCEIRO_API_URL ?? "/condominio/gateway/financeiro",
} as const;
const NOMES = { morador: "MS Moradores", financeiro: "MS Financeiro" } as const;
export type Servico = keyof typeof BASES;
const TOKEN_KEY = "proptech.token";
/** tempo máximo de espera por uma resposta da API */
const TIMEOUT_MS = 10_000;
const MSG_ACESSO_NEGADO = "Acesso negado. Você não tem permissão para esta ação.";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t: string | null) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* sem storage: segue sem persistir */
  }
};

type Query = Record<string, string | number | boolean | undefined | null>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function http<T = any>(
  path: string,
  opts: { method?: string; body?: unknown; query?: Query; servico?: Servico } = {},
): Promise<T> {
  const servico = opts.servico ?? "morador";
  const url = new URL(BASES[servico] + path, window.location.origin);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const token = getToken();
  // timeout: sem resposta em TIMEOUT_MS a chamada é cancelada (a espera inclui a leitura do corpo)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  let text: string;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? "GET",
      headers: {
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
    text = await res.text();
  } catch {
    if (controller.signal.aborted) {
      throw new ApiError(`A API demorou mais de ${TIMEOUT_MS / 1000} s para responder. Tente novamente.`, 0);
    }
    throw new ApiError(`Não foi possível falar com a API. Verifique se o ${NOMES[servico]} está rodando.`, 0);
  } finally {
    clearTimeout(timer);
  }
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith("/auth/login")) onUnauthorized?.();
    // 5xx sem corpo JSON = proxy/gateway sem conseguir chegar no microsserviço (ex.: backend desligado)
    if (res.status >= 500 && !data?.message) {
      throw new ApiError(`API indisponível (erro ${res.status}). Verifique se o ${NOMES[servico]} está no ar.`, res.status);
    }
    const m = data?.message;
    const msg = Array.isArray(m) ? m.join(" · ") : m || `Erro ${res.status}`;
    // 403 do NestJS vem em inglês ("Forbidden resource"): troca por uma mensagem clara; mensagens próprias da API são mantidas
    if (res.status === 403 && (!m || m === "Forbidden resource")) throw new ApiError(MSG_ACESSO_NEGADO, 403);
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

function safeJson(t: string) {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}
