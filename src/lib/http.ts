// Cliente HTTP do MS Moradores: injeta o JWT e padroniza erros do NestJS.
//
// NEXT_PUBLIC_API_URL é gravado no build. Exemplos:
//   produção (padrão): /condominio/gateway/morador  → gateway http://academico3.rj.senac.br/condominio/gateway,
//                       rota do MS Moradores; relativo = mesma origem, sem CORS
//   dev               : o mesmo valor; o next.config.ts encaminha para API_PROXY_TARGET (MS local)
const BASE: string = process.env.NEXT_PUBLIC_API_URL ?? "/condominio/gateway/morador";
const TOKEN_KEY = "proptech.token";

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
  opts: { method?: string; body?: unknown; query?: Query } = {},
): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? "GET",
      headers: {
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError("Não foi possível falar com a API. Verifique se o MS Moradores está rodando.", 0);
  }
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith("/auth/login")) onUnauthorized?.();
    const m = data?.message;
    const msg = Array.isArray(m) ? m.join(" · ") : m || `Erro ${res.status}`;
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
