"use client";

import { setIdioma, useIdioma, type Idioma } from "@/i18n";
import { cx } from "./ui";

const OPCOES: { id: Idioma; sigla: string; nome: string }[] = [
  { id: "pt", sigla: "PT", nome: "Português" },
  { id: "en", sigla: "EN", nome: "English" },
];

// Seletor de idioma: dois botões (PT | EN). O idioma escolhido fica salvo no navegador.
export function LanguageToggle({ variant = "claro", className }: { variant?: "claro" | "escuro"; className?: string }) {
  const atual = useIdioma();
  const escuro = variant === "escuro";
  return (
    <div role="group" aria-label="Idioma / Language" className={cx("flex h-10 flex-none overflow-hidden rounded-[10px] border text-[11px] font-extrabold min-[820px]:h-9", escuro ? "border-white/25 text-white" : "border-line", className)}>
      {OPCOES.map((o) => {
        const on = o.id === atual;
        return (
          <button
            key={o.id}
            type="button"
            lang={o.id}
            aria-pressed={on}
            aria-label={o.nome}
            title={o.nome}
            onClick={() => setIdioma(o.id)}
            className={cx("min-w-7 border-0 px-1.5 min-[820px]:min-w-8", on ? (escuro ? "bg-white text-navy" : "bg-primary text-white") : escuro ? "bg-white/12 text-white" : "bg-surface text-ink-2")}
          >
            {o.sigla}
          </button>
        );
      })}
    </div>
  );
}
