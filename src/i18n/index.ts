"use client";

import { useSyncExternalStore } from "react";
import { API_EN, EN } from "./en";

// Idioma da interface (português é o padrão). O texto-fonte do sistema está em português e serve de chave:
// t("Salvar") devolve "Save" em inglês; sem tradução cadastrada em ./en.ts, devolve o próprio texto.
// O idioma vive no atributo lang do <html> (definido antes da pintura pelo script do layout), como o tema.
export type Idioma = "pt" | "en";

export const CHAVE_IDIOMA = "proptech-idioma";
const HTML_LANG: Record<Idioma, string> = { pt: "pt-BR", en: "en" };

// Idioma usado na renderização em andamento. Quem renderiza texto chama useIdioma()/useT() (que o atualiza
// e faz a tela se redesenhar quando o idioma muda); funções comuns, como as configurações das listas, só chamam t().
let corrente: Idioma = "pt";
const fixar = (l: Idioma) => {
  corrente = l;
};

const doDocumento = (): Idioma => (typeof document !== "undefined" && document.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "pt");

const ouvintes = new Set<() => void>();
let observador: MutationObserver | null = null;
const observar = (aviso: () => void) => {
  ouvintes.add(aviso);
  if (!observador) {
    observador = new MutationObserver(() => ouvintes.forEach((f) => f()));
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
  return () => {
    ouvintes.delete(aviso);
    if (ouvintes.size === 0) {
      observador?.disconnect();
      observador = null;
    }
  };
};

/** Idioma atual; redesenha o componente quando o usuário troca. No servidor e na hidratação vale "pt". */
export function useIdioma(): Idioma {
  const l = useSyncExternalStore(observar, doDocumento, () => "pt" as Idioma);
  fixar(l);
  return l;
}

/** Traduz `chave` (o texto em português). "{nome}" no texto é trocado pelo valor de `vars.nome`. */
export function t(chave: string, vars?: Record<string, string | number>): string {
  // "Início|menu": o texto depois de "|" só distingue o mesmo texto em usos diferentes (em português é descartado)
  let s = corrente === "en" ? (EN[chave] ?? chave.split("|")[0]!) : chave.split("|")[0]!;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
  return s;
}

/** Traduz uma mensagem do backend (texto exato ou com números/nomes no meio). Sem tradução, devolve a original. */
export function tApi(msg: string): string {
  if (corrente !== "en") return msg;
  if (EN[msg]) return EN[msg];
  for (const [re, f] of API_EN) {
    const m = re.exec(msg);
    if (m) return f(m);
  }
  return msg;
}

/** Hook para componentes: assina o idioma e devolve `t`. */
export function useT() {
  useIdioma();
  return t;
}

export const ingles = () => corrente === "en";
/** Local usado por Intl (datas, números, moeda) */
export const localeAtual = () => (corrente === "en" ? "en-US" : "pt-BR");

export function setIdioma(l: Idioma) {
  document.documentElement.lang = HTML_LANG[l];
  try {
    localStorage.setItem(CHAVE_IDIOMA, l);
  } catch {
    /* sem armazenamento (janela privada): o idioma vale só nesta sessão */
  }
}
