"use client";

import Link from "next/link";
import { useT } from "@/i18n";

export default function NotFound() {
  const t = useT();
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1 className="m-0 text-[22px] font-extrabold text-title">{t("Página não encontrada")}</h1>
        <p className="mt-1 mb-4 text-muted">{t("O endereço não existe neste sistema.")}</p>
        <Link href="/" className="rounded-[9px] bg-primary px-4 py-[9px] text-[12.5px] font-bold text-white">
          {t("Voltar ao início")}
        </Link>
      </div>
    </div>
  );
}
