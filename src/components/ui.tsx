"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

// ------------------------------------------------------------------ classes compartilhadas
export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

const BTN_BASE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[9px] border px-4 py-[9px] text-[12.5px] font-bold disabled:cursor-not-allowed disabled:opacity-55";
const BTN_VARIANTS = {
  primary: "border-transparent bg-primary text-white hover:bg-navy",
  ghost: "border-transparent bg-line-soft text-ink-2 hover:bg-line",
  outline: "border-primary bg-white text-primary",
  amber: "border-transparent bg-accent text-white",
  danger: "border-red-300 bg-white text-red-700",
  glass: "border-white/40 bg-white/20 text-white",
  white: "border-transparent bg-white text-navy",
} as const;
export type BtnVariant = keyof typeof BTN_VARIANTS;
/** classes de botão — serve para <button> e para <Link> */
export const btn = (v: BtnVariant = "primary") => `${BTN_BASE} ${BTN_VARIANTS[v]}`;

const INPUT_BASE =
  "rounded-[10px] border border-line bg-white px-3 py-2.5 text-[13px] focus:border-primary focus:shadow-[0_0_0_3px_rgba(30,58,138,0.12)] focus:outline-none";
export const inputCls = `w-full ${INPUT_BASE}`;
/** igual ao input, sem largura fixa (para selects de filtro na barra) */
export const inputAutoCls = `${INPUT_BASE} w-auto min-w-40`;
export const searchCls =
  "search-icon h-[34px] rounded-[10px] border border-line bg-page pr-3 pl-8 text-[12.5px] focus:border-primary focus:outline-none";

// ------------------------------------------------------------------ peças
const VERDE = ["ATIVO", "ATIVA", "CONFIRMADO", "CONFIRMADA", "PAGO", "CONCLUIDA", "FINALIZADA", "COM LOGIN", "SINDICO"];
const AMBAR = ["PENDENTE", "ABERTA", "ENCERRANDO", "EM_EXECUCAO", "EM_ANDAMENTO", "TEMPORADA"];
const VERMELHO = ["VENCIDO", "CANCELADO", "CANCELADA"];
const AZUL = ["PROPRIETARIO", "INQUILINO", "MORADOR", "APARTAMENTO", "COBERTURA", "PIX", "BOLETO", "CARTAO"];

export function Badge({ children }: { children: string }) {
  const k = children.toUpperCase();
  const cor = VERDE.includes(k)
    ? "bg-ok-bg text-ok-fg"
    : AMBAR.includes(k)
      ? "bg-warn-bg text-warn-fg"
      : VERMELHO.includes(k)
        ? "bg-bad-bg text-bad-fg"
        : AZUL.includes(k)
          ? "bg-soft-blue text-primary"
          : "bg-line-soft text-ink-2";
  return <span className={`inline-block rounded-full px-[9px] py-0.5 text-[10px] font-extrabold tracking-[0.02em] uppercase ${cor}`}>{children}</span>;
}

export function MockTag({ children = "DADOS SIMULADOS", blue }: { children?: string; blue?: boolean }) {
  return (
    <span className={cx("ml-2 inline-block rounded-full px-2 py-px align-middle text-[9.5px] font-extrabold tracking-[0.03em]", blue ? "bg-soft-blue text-primary" : "bg-warn-bg text-warn-fg")}>
      {children}
    </span>
  );
}

export function PageHeader({ title, sub, actions, back = true }: { title: string; sub?: ReactNode; actions?: ReactNode; back?: boolean }) {
  const router = useRouter();
  return (
    <div className="mb-[18px] flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="m-0 text-[22px] font-extrabold tracking-[-0.01em] text-navy">{title}</h1>
        {sub && <div className="mt-1 text-[12.5px] text-muted">{sub}</div>}
      </div>
      <div className="flex flex-wrap justify-end gap-2.5">
        {actions}
        {back && (
          <button type="button" className={btn("ghost")} onClick={() => router.back()}>
            ← Voltar
          </button>
        )}
      </div>
    </div>
  );
}

export function Card({ title, count, children, className = "" }: { title?: string; count?: number; children: ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-xl bg-white shadow-card ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-line-soft px-5 py-4">
          <h3 className="m-0 text-sm font-bold">{title}</h3>
          {count !== undefined && <span className="rounded-full bg-soft-blue px-2 py-0.5 text-[10.5px] font-bold text-primary">{count}</span>}
        </header>
      )}
      {children}
    </section>
  );
}

const STAT_BORDER = { navy: "border-l-navy", green: "border-l-ok", amber: "border-l-accent", pink: "border-l-pink" } as const;
export function StatCard({ value, label, color, className = "" }: { value: ReactNode; label: string; color: keyof typeof STAT_BORDER; className?: string }) {
  return (
    <div className={`rounded-xl border-l-[3px] bg-white px-5 py-[22px] shadow-card ${STAT_BORDER[color]} ${className}`}>
      <div className="text-[26px] leading-[1.1] font-extrabold text-navy">{value}</div>
      <div className="mt-1.5 text-[11px] font-semibold tracking-[0.03em] text-muted uppercase">{label}</div>
    </div>
  );
}

export const StatGrid = ({ children }: { children: ReactNode }) => <div className="mb-[26px] grid grid-cols-1 gap-4 min-[820px]:grid-cols-2 min-[1100px]:grid-cols-4">{children}</div>;
export const ModuleGrid = ({ children, three }: { children: ReactNode; three?: boolean }) => (
  <div className={cx("mb-[26px] grid grid-cols-1 gap-4 min-[820px]:grid-cols-2", three ? "min-[1100px]:grid-cols-3" : "min-[1100px]:grid-cols-4")}>{children}</div>
);
export const SectionLabel = ({ children }: { children: ReactNode }) => <div className="mb-3 text-[11px] font-bold tracking-[0.04em] text-muted uppercase">{children}</div>;

export function ModuleCard({ icon, title, desc, to, tint }: { icon: string; title: string; desc: string; to: string; tint: string }) {
  return (
    <Link href={to} className="flex flex-col gap-1 rounded-xl bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
      <span className="mb-2 grid size-[42px] place-items-center rounded-[10px] text-[19px]" style={{ background: tint }}>
        {icon}
      </span>
      <strong className="text-[15px]">{title}</strong>
      <span className="text-[11.5px] text-muted">{desc}</span>
      <span className="mt-1.5 text-[11.5px] font-bold text-primary">Abrir listagem →</span>
    </Link>
  );
}

export const Empty = ({ children }: { children: ReactNode }) => <div className="p-9 text-center text-muted">{children}</div>;
export const Loading = () => <div className="p-9 text-center text-muted">Carregando…</div>;
export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3.5 rounded-[10px] bg-bad-bg px-3.5 py-[11px] text-[12.5px] font-semibold text-bad-fg" role="alert">
      {children}
    </div>
  );
}

/** linha "ícone + título + subtítulo + lado direito", usada nas listas do portal e nos painéis relacionados */
export function RowItem({ ico, tint = "#eef2fb", title, sub, right, to }: { ico: string; tint?: string; title: string; sub: string; right?: ReactNode; to?: string }) {
  const cls = "flex items-center gap-3 border-b border-line-soft px-5 py-3.5 last:border-b-0";
  const body = (
    <>
      <span className="grid size-9 flex-none place-items-center rounded-[10px] text-base" style={{ background: tint }}>
        {ico}
      </span>
      <span className="grow">
        <strong className="block text-[13px]">{title}</strong>
        <small className="text-[11.5px] text-muted">{sub}</small>
      </span>
      {right}
    </>
  );
  return to ? (
    <Link href={to} className={`${cls} hover:bg-[#f8f9fd]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function RelatedList({ title, items, footer }: { title: string; items: { icon: string; title: string; sub: string; to?: string }[]; footer?: { label: string; to: string; hint?: string } }) {
  return (
    <Card title={title} count={items.length}>
      {items.length === 0 && <Empty>Nada vinculado ainda.</Empty>}
      {items.map((it, i) => (
        <RowItem key={i} ico={it.icon} title={it.title} sub={it.sub} to={it.to} />
      ))}
      {footer && (
        <Link href={footer.to} className="flex items-center justify-between border-t border-line-soft px-5 py-3.5 text-[12.5px] font-bold text-primary">
          <span>{footer.label}</span>
          {footer.hint && <small className="font-medium text-muted">{footer.hint}</small>}
        </Link>
      )}
    </Card>
  );
}

/** linha de chave/valor dos cartões de detalhe */
export const KV = ({ k, children }: { k: string; children: ReactNode }) => (
  <div className="flex justify-between gap-4 border-b border-line-soft px-5 py-3 last:border-b-0">
    <span className="text-[12px] text-muted">{k}</span>
    <b className="text-right text-[12.5px] font-semibold">{children}</b>
  </div>
);

const HERO_BG = {
  navy: "from-navy to-primary",
  amber: "from-[#92400e] to-accent",
  green: "from-ok-fg to-ok",
  pink: "from-[#9d174d] to-pink",
} as const;
export function Hero({ color, children, actions }: { color: keyof typeof HERO_BG; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className={`mb-5 flex flex-wrap items-center justify-between gap-4 rounded-[14px] bg-linear-to-br px-[26px] py-[22px] text-white ${HERO_BG[color]}`}>
      <div>{children}</div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}
export const HeroBadges = ({ items }: { items: string[] }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((b) => (
      <span key={b} className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold">
        {b}
      </span>
    ))}
  </div>
);
export const DetailGrid = ({ children, even }: { children: ReactNode; even?: boolean }) => (
  <div className={cx("grid grid-cols-1 items-start gap-5", even ? "min-[1100px]:grid-cols-2" : "min-[1100px]:grid-cols-[1.1fr_1fr]")}>{children}</div>
);
