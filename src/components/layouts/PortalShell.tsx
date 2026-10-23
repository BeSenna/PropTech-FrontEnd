"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { ErrorBox, Loading, cx } from "@/components/ui";
import { iniciais } from "@/lib/format";
import type { Rec } from "@/lib/types";
import { blocoLetra, imovelRotulo, moradorApi } from "@/resources/api";
import { semearPortal } from "@/mock/data";

export interface PortalCtx {
  moradorId: number;
  nome: string;
  vinculo: Rec | null; // vínculo ativo principal
  imovelId: number | null;
  imovelLabel: string;
  blocoNome: string;
  morador: Rec;
}
const PCtx = createContext<PortalCtx | null>(null);
export const usePortal = () => {
  const c = useContext(PCtx);
  if (!c) throw new Error("usePortal fora do portal");
  return c;
};

const NAV = [
  { to: "/portal", label: "Início", exact: true },
  { to: "/portal/imovel", label: "Meu Imóvel" },
  { to: "/portal/cobrancas", label: "Financeiro" },
  { to: "/portal/reservas", label: "Reservas" },
  { to: "/portal/ocorrencias", label: "Ocorrências" },
  { to: "/portal/avisos", label: "Avisos" },
];

export function PortalShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [ctx, setCtx] = useState<PortalCtx | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!user?.moradorId) {
        setErro("Esta conta ainda não está vinculada a um morador. Peça ao síndico para criar o acesso a partir de uma relação.");
        return;
      }
      try {
        const m = await moradorApi.get(user.moradorId);
        const vs: Rec[] = (m.moradorImoveis ?? []).filter((v: Rec) => v.moradorImovelStatus === 1);
        const v = vs.find((x) => !x.moradorImovelDataFim || new Date(x.moradorImovelDataFim) > new Date()) ?? vs[0] ?? null;
        const imovelLabel = v ? imovelRotulo(v.imovel, undefined).replace(/ · .*/, "") : "";
        const blocoNome = v?.imovel?.bloco?.blocoNome ?? "";
        semearPortal(m.moradorId, m.moradorNome, v?.imovelId ?? null, imovelLabel, blocoLetra(blocoNome));
        if (vivo) setCtx({ moradorId: m.moradorId, nome: m.moradorNome, vinculo: v, imovelId: v?.imovelId ?? null, imovelLabel, blocoNome, morador: m });
      } catch (e) {
        if (vivo) setErro((e as Error).message);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [user?.moradorId]);

  const nome = ctx?.nome ?? user?.usuarioLogin ?? "";
  return (
    <div className="min-h-screen">
      <header className="h-[72px] bg-navy text-white">
        <div className="flex h-full items-center gap-3 overflow-x-auto px-4 min-[820px]:gap-8 min-[820px]:px-10">
          <Link href="/portal" className="flex flex-none items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-[9px] bg-accent text-[13px] font-extrabold text-navy">PT</div>
            <strong className="text-sm text-white">PropTech</strong>
          </Link>
          <nav className="flex flex-1 gap-4 min-[820px]:gap-[26px]" aria-label="Portal do morador">
            {NAV.map((n) => {
              const ativo = n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(`${n.to}/`);
              return (
                <Link key={n.to} href={n.to} className={cx("border-b-2 py-1.5 text-[13.5px] whitespace-nowrap", ativo ? "border-accent font-bold text-white" : "border-transparent font-medium text-side")}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-none items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-soft-blue text-[11px] font-extrabold text-navy">{iniciais(nome)}</div>
            <div>
              <strong className="block text-xs max-[820px]:hidden">{nome}</strong>
              <small>
                <button onClick={logout} className="border-0 bg-transparent p-0 text-[10.5px] text-side-muted hover:text-white hover:underline">
                  Sair
                </button>
              </small>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[980px] px-6 pt-8 pb-14">{erro ? <ErrorBox>{erro}</ErrorBox> : !ctx ? <Loading /> : <PCtx.Provider value={ctx}>{children}</PCtx.Provider>}</main>
    </div>
  );
}
