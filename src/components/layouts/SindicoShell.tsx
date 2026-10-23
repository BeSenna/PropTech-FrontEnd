"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { cx, searchCls } from "@/components/ui";
import { iniciais } from "@/lib/format";
import { totalDe } from "@/resources/api";
import { areaStore, avisoStore, cobrancaStore, despesaStore, manutencaoStore, ocorrenciaStore, pagamentoStore, receitaStore, reservaStore } from "@/mock/data";

const ROTULOS: Record<string, string> = {
  cadastros: "Cadastros",
  blocos: "Blocos",
  imoveis: "Imóveis",
  moradores: "Moradores",
  vinculos: "Relação",
  usuarios: "Usuários",
  financeiro: "Financeiro",
  cobrancas: "Cobranças",
  pagamentos: "Pagamentos",
  despesas: "Despesas",
  receitas: "Receitas",
  servicos: "Serviços",
  "areas-comuns": "Áreas Comuns",
  reservas: "Reservas",
  ocorrencias: "Ocorrências",
  manutencoes: "Manutenções",
  avisos: "Avisos",
};

type Counts = Record<string, number>;

async function carregarContagens(): Promise<Counts> {
  const c: Counts = {
    areas: areaStore.count(),
    reservas: reservaStore.count(),
    cobrancas: cobrancaStore.count(),
    pagamentos: pagamentoStore.count(),
    despesas: despesaStore.count(),
    receitas: receitaStore.count(),
    ocorrencias: ocorrenciaStore.count(),
    manutencoes: manutencaoStore.count(),
    avisos: avisoStore.count(),
  };
  try {
    const [b, i, m, v] = await Promise.all([totalDe("/bloco"), totalDe("/imovel"), totalDe("/morador"), totalDe("/morador-imovel")]);
    Object.assign(c, { blocos: b, imoveis: i, moradores: m, vinculos: v });
  } catch {
    /* API fora do ar: o conteúdo das telas mostra o erro; o menu segue sem contagem */
  }
  return c;
}

function Item({ to, label, n, sub }: { to: string; label: string; n?: number; sub?: boolean }) {
  const path = usePathname();
  const ativo = to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`);
  return (
    <Link
      href={to}
      className={cx(
        "my-0.5 flex items-center gap-2.5 rounded-[10px] py-[9px] pr-3 font-medium",
        sub ? "pl-[22px]" : "pl-3",
        ativo ? "bg-accent font-bold text-navy" : "text-side hover:bg-white/7",
        to !== "/" && "before:flex-none before:rounded-full before:content-['']",
        to !== "/" && (sub ? "before:size-1" : "before:size-1.5"),
        to !== "/" && (ativo ? "before:bg-navy/45" : "before:bg-side-muted"),
      )}
    >
      {label}
      {n !== undefined && <span className={cx("ml-auto text-[10.5px] font-bold", ativo ? "text-navy" : "text-white")}>{n}</span>}
    </Link>
  );
}

const Grupo = ({ children }: { children: string }) => <div className="mt-3.5 mb-0.5 font-medium text-side">{children}</div>;

export function SindicoShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [counts, setCounts] = useState<Counts>({});
  const [q, setQ] = useState("");

  useEffect(() => {
    let vivo = true;
    carregarContagens().then((c) => vivo && setCounts(c));
    return () => {
      vivo = false;
    };
  }, [pathname]);

  const segs = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; to?: string }[] = [{ label: "Dashboard", to: "/" }];
  if (segs[0]) crumbs.push({ label: ROTULOS[segs[0]] ?? segs[0], to: segs.length > 1 ? `/${segs[0]}` : undefined });
  if (segs[1]) crumbs.push({ label: segs[1] === "novo" ? "Novo" : `#${segs[1]}`, to: segs[2] ? `/${segs[0]}/${segs[1]}` : undefined });
  if (segs[2]) crumbs.push({ label: "Editar" });

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/moradores?busca=${encodeURIComponent(q)}`);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 min-[820px]:grid-cols-[252px_1fr]">
      <aside className="flex flex-col overflow-y-auto bg-navy px-3.5 pt-5 pb-3.5 text-side min-[820px]:sticky min-[820px]:top-0 min-[820px]:h-screen" aria-label="Menu principal">
        <div className="flex items-center gap-2.5 pb-3.5">
          <div className="grid size-8 flex-none place-items-center rounded-[9px] bg-accent text-[13px] font-extrabold text-navy">PT</div>
          <div>
            <strong className="block text-sm text-white">PropTech</strong>
            <small className="text-[10.5px] text-side-muted">condominio_moradores</small>
          </div>
        </div>
        <div className="mt-1.5 mb-1 text-[10px] font-bold tracking-[0.04em] text-[#7c8ac2] uppercase">Início</div>
        <Item to="/" label="Dashboard" />

        <Grupo>Cadastros</Grupo>
        <Item to="/cadastros" label="Visão Geral" />
        <Item to="/blocos" label="Blocos" n={counts.blocos} />
        <Item to="/imoveis" label="Imóveis" n={counts.imoveis} />
        <Item to="/vinculos" label="Relação" n={counts.vinculos} sub />
        <Item to="/moradores" label="Moradores" n={counts.moradores} />
        <Item to="/usuarios" label="Usuários" />

        <Grupo>Financeiro</Grupo>
        <Item to="/financeiro" label="Visão Geral" />
        <Item to="/cobrancas" label="Cobranças" n={counts.cobrancas} />
        <Item to="/pagamentos" label="Pagamentos" n={counts.pagamentos} sub />
        <Item to="/despesas" label="Despesas" n={counts.despesas} />
        <Item to="/receitas" label="Receitas" n={counts.receitas} />

        <Grupo>Serviços</Grupo>
        <Item to="/servicos" label="Visão Geral (Serviços)" />
        <Item to="/areas-comuns" label="Áreas Comuns" n={counts.areas} />
        <Item to="/reservas" label="Reservas" n={counts.reservas} sub />
        <Item to="/ocorrencias" label="Ocorrências" n={counts.ocorrencias} />
        <Item to="/manutencoes" label="Manutenções" n={counts.manutencoes} sub />
        <Item to="/avisos" label="Avisos" n={counts.avisos} />

        <div className="sticky bottom-0 mt-auto flex items-center gap-2.5 rounded-[10px] border border-white/15 bg-navy p-2.5 shadow-[0_-10px_12px_var(--color-navy)]">
          <div className="grid size-8 flex-none place-items-center rounded-lg bg-soft-blue text-[11px] font-extrabold text-navy">{iniciais(user?.usuarioLogin)}</div>
          <div>
            <strong className="block text-xs text-white">{user?.usuarioLogin}</strong>
            <small className="text-[10.5px] text-side-muted">
              Síndico(a) ·{" "}
              <button onClick={logout} className="border-0 bg-transparent p-0 text-[10.5px] text-side-muted hover:text-white hover:underline">
                Sair
              </button>
            </small>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-5 flex h-16 items-center gap-3 border-b border-line bg-white px-4 min-[820px]:px-7">
          <nav className="flex flex-wrap gap-1.5 text-[13px] font-bold" aria-label="Você está em">
            {crumbs.map((c, i) => (
              <span key={i} className="contents">
                {i > 0 && <span className="font-medium text-muted-2">/</span>}
                {c.to ? (
                  <Link href={c.to} className="hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span>{c.label}</span>
                )}
              </span>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <form onSubmit={buscar} className="max-[820px]:hidden">
              <input className={cx(searchCls, "w-60")} type="search" placeholder="Buscar em Moradores..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar moradores" />
            </form>
            <button className="size-9 rounded-[10px] border border-line bg-white" aria-label="Notificações" type="button" onClick={() => router.push("/avisos")}>
              🔔
            </button>
            <div className="grid size-[34px] place-items-center rounded-[10px] bg-primary text-[11.5px] font-extrabold text-white" title={user?.usuarioLogin}>
              {iniciais(user?.usuarioLogin)}
            </div>
          </div>
        </header>
        <main className="px-4 pt-5 pb-10 min-[820px]:px-7 min-[820px]:pt-[26px] min-[820px]:pb-12">{children}</main>
      </div>
    </div>
  );
}
