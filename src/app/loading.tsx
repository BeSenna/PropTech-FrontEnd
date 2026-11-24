"use client";

import { useT } from "@/i18n";

// Mostrado pelo Next.js enquanto uma página está carregando (equivale ao loading.js do roteiro de aula).
export default function Carregando() {
  const t = useT();
  return (
    <div role="status" aria-live="polite" className="grid min-h-screen place-items-center p-6 text-muted">
      {t("Carregando…")}
    </div>
  );
}
