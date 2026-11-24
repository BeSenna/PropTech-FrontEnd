"use client";

import { useEffect } from "react";
import { useT } from "@/i18n";

// Último recurso: erro no próprio layout raiz. Este arquivo SUBSTITUI o layout, então precisa de <html> e <body>
// e não recebe o CSS global — por isso o estilo é inline.
export default function ErroGlobal({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", color: "#1e293b", background: "#f8fafc" }}>
        <div role="alert" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <title>{t("Erro")} · PropTech</title>
            <h1 style={{ fontSize: 22, margin: 0 }}>{t("Algo deu errado")}</h1>
            <p style={{ color: "#64748b" }}>{t("O sistema encontrou um erro inesperado. Tente novamente.")}</p>
            <button
              type="button"
              onClick={() => retry()}
              style={{ border: 0, borderRadius: 9, padding: "9px 16px", background: "#1e3a8a", color: "#fff", fontWeight: 700, cursor: "pointer" }}
            >
              {t("Tentar novamente")}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
