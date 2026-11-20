"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cx, searchCls } from "@/components/ui";
import { iniciais } from "@/lib/format";
import { totalDe } from "@/services/moradorService";
import { areaStore, avisoStore, manutencaoStore, ocorrenciaStore, reservaStore } from "@/mock/data";

const ROTULOS: Record<string, string> = {
  cadastros: "Cadastros",
  blocos: "Blocos",
  imoveis: "Imóveis",
  moradores: "Moradores",
  vinculos: "Relação",
  usuarios: "Usuários",
  financeiro: "Financeiro",
  cobrancas: "Cobranças",
  boletos: "Boletos",
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
    ocorrencias: ocorrenciaStore.count(),
    manutencoes: manutencaoStore.count(),
    avisos: avisoStore.count(),
  };
  // cada serviço é consultado à parte: se um estiver fora do ar, o menu do outro continua com as contagens
  const [mor, fin] = await Promise.allSettled([
    Promise.all([totalDe("/bloco"), totalDe("/imovel"), totalDe("/morador"), totalDe("/morador-imovel")]),
    Promise.all(["/cobrancas", "/boletos", "/pagamentos", "/despesas", "/receitas"].map((p) => totalDe(p, {}, "financeiro"))),
  ]);
  if (mor.status === "fulfilled") {
    const [b, i, m, v] = mor.value;
    Object.assign(c, { blocos: b, imoveis: i, moradores: m, vinculos: v });
  }
  if (fin.status === "fulfilled") {
    const [co, bo, pa, de, re] = fin.value;
    Object.assign(c, { cobrancas: co, boletos: bo, pagamentos: pa, despesas: de, receitas: re });
  }
  // API fora do ar: o conteúdo das telas mostra o erro; o menu segue sem contagem
  return c;
}

// o Dashboard (início do síndico) fica sem o marcador de bolinha dos demais itens
const INICIO = "/dashboard";

function Item({ to, label, n, sub }: { to: string; label: string; n?: number; sub?: boolean }) {
  const path = usePathname();
  const ativo = path === to || path.startsWith(`${to}/`);
  return (
    <Link
      href={to}
      className={cx(
        "my-0.5 flex items-center gap-2.5 rounded-[10px] py-[9px] pr-3 font-medium",
        sub ? "pl-[22px]" : "pl-3",
        ativo ? "bg-accent font-bold text-on-accent" : "text-side hover:bg-white/7",
        to !== INICIO && "before:flex-none before:rounded-full before:content-['']",
        to !== INICIO && (sub ? "before:size-1" : "before:size-1.5"),
        to !== INICIO && (ativo ? "before:bg-navy/45" : "before:bg-side-muted"),
      )}
    >
      {label}
      {n !== undefined && <span className={cx("ml-auto text-[10.5px] font-bold", ativo ? "text-on-accent" : "text-white")}>{n}</span>}
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
  // abaixo de 820px o menu vira uma gaveta aberta pelo botão do topo (acima disso fica fixo na lateral)
  const [menuAberto, setMenuAberto] = useState(false);

  // ao navegar, a gaveta fecha
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  // gaveta aberta: Esc fecha e a página de trás não rola
  useEffect(() => {
    if (!menuAberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenuAberto(false);
    document.addEventListener("keydown", esc);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = antes;
    };
  }, [menuAberto]);

  useEffect(() => {
    let vivo = true;
    carregarContagens().then((c) => vivo && setCounts(c));
    return () => {
      vivo = false;
    };
  }, [pathname]);

  const segs = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; to?: string }[] = [{ label: "Dashboard", to: INICIO }];
  if (segs[0] && segs[0] !== "dashboard") crumbs.push({ label: ROTULOS[segs[0]] ?? segs[0], to: segs.length > 1 ? `/${segs[0]}` : undefined });
  if (segs[1]) crumbs.push({ label: segs[1] === "novo" ? "Novo" : `#${segs[1]}`, to: segs[2] ? `/${segs[0]}/${segs[1]}` : undefined });
  if (segs[2]) crumbs.push({ label: "Editar" });

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    setMenuAberto(false);
    router.push(`/moradores?busca=${encodeURIComponent(q)}`);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 min-[820px]:grid-cols-[252px_1fr]">
      {menuAberto && <button type="button" tabIndex={-1} aria-label="Fechar menu" className="fixed inset-0 z-30 border-0 bg-black/50 min-[820px]:hidden" onClick={() => setMenuAberto(false)} />}
      <aside
        id="menu-principal"
        className={cx(
          "flex flex-col overflow-y-auto bg-navy px-3.5 pt-5 pb-3.5 text-side min-[820px]:sticky min-[820px]:top-0 min-[820px]:h-screen",
          // celular/tablet: gaveta por cima do conteúdo; fechada fica fora da tela e fora da navegação por teclado
          "max-[819px]:fixed max-[819px]:inset-y-0 max-[819px]:left-0 max-[819px]:z-40 max-[819px]:w-[280px] max-[819px]:max-w-[85vw] max-[819px]:transition-[transform,visibility] max-[819px]:duration-200",
          !menuAberto && "max-[819px]:invisible max-[819px]:-translate-x-full",
        )}
        aria-label="Menu principal"
      >
        <div className="flex items-center gap-2.5 pb-3.5">
          <div className="grid size-8 flex-none place-items-center rounded-[9px] bg-accent text-[13px] font-extrabold text-on-accent">PT</div>
          <div>
            <strong className="block text-sm text-white">PropTech</strong>
          </div>
          <button type="button" className="ml-auto grid size-10 flex-none place-items-center rounded-[10px] border-0 bg-white/10 text-lg text-white min-[820px]:hidden" aria-label="Fechar menu" onClick={() => setMenuAberto(false)}>
            ✕
          </button>
        </div>
        <form onSubmit={buscar} className="mb-2 min-[820px]:hidden">
          <input className={cx(searchCls, "h-10 w-full bg-surface text-ink-2 placeholder:text-muted")} type="search" placeholder="Buscar em Moradores..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar moradores" />
        </form>
        <div className="mt-1.5 mb-1 text-[10px] font-bold tracking-[0.04em] text-[#7c8ac2] uppercase">Início</div>
        <Item to={INICIO} label="Dashboard" />

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
        <Item to="/boletos" label="Boletos" n={counts.boletos} />
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
          <div className="grid size-8 flex-none place-items-center rounded-lg bg-soft-blue text-[11px] font-extrabold text-title">{iniciais(user?.usuarioLogin)}</div>
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
        <header className="sticky top-0 z-5 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 min-[820px]:px-7">
          <button type="button" className="grid size-10 flex-none place-items-center rounded-[10px] border border-line bg-surface min-[820px]:hidden" aria-label="Abrir menu" aria-expanded={menuAberto} aria-controls="menu-principal" onClick={() => setMenuAberto(true)}>
            <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1h16M1 7h16M1 13h16" />
            </svg>
          </button>
          <nav className="flex min-w-0 flex-wrap gap-1.5 text-[13px] font-bold" aria-label="Você está em">
            {crumbs.map((c, i) => (
              <span key={c.label} className="contents">
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
            <form onSubmit={buscar} className="max-[819px]:hidden">
              <input className={cx(searchCls, "w-60")} type="search" placeholder="Buscar em Moradores..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar moradores" />
            </form>
            <ThemeToggle />
            <button className="size-10 rounded-[10px] border border-line bg-surface min-[820px]:size-9" aria-label="Notificações" type="button" onClick={() => router.push("/avisos")}>
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
