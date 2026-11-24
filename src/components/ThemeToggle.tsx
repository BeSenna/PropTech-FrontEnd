"use client";

import { useSyncExternalStore } from "react";
import { useT } from "@/i18n";
import { cx } from "./ui";

const CHAVE = "proptech-tema";

// O tema vive no atributo data-theme do <html> (definido antes da pintura pelo script do layout).
// useSyncExternalStore mantém o botão em sincronia sem setState em efeito e sem divergir na hidratação.
const observar = (aviso: () => void) => {
  const o = new MutationObserver(aviso);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => o.disconnect();
};
const escuroAgora = () => document.documentElement.dataset.theme === "dark";

export function ThemeToggle({ variant = "claro", className }: { variant?: "claro" | "escuro"; className?: string }) {
  const t = useT();
  const escuro = useSyncExternalStore(observar, escuroAgora, () => false);

  const alternar = () => {
    const novo = escuro ? "light" : "dark";
    document.documentElement.dataset.theme = novo;
    try {
      localStorage.setItem(CHAVE, novo);
    } catch {
      /* sem armazenamento (janela privada): o tema vale só nesta sessão */
    }
  };

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={t("Tema escuro")}
      aria-pressed={escuro}
      title={escuro ? t("Voltar ao tema claro") : t("Ativar tema escuro")}
      className={cx(
        "grid size-10 flex-none place-items-center rounded-[10px] border text-[13px] min-[820px]:size-9",
        variant === "escuro" ? "border-white/25 bg-white/12 text-white" : "border-line bg-surface",
        className,
      )}
    >
      <span aria-hidden="true">{escuro ? "☀️" : "🌙"}</span>
    </button>
  );
}
