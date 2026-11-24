"use client";

import Link from "next/link";
import { rotulo } from "@/lib/labels";
import { useT } from "@/i18n";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

// ------------------------------------------------------------------ classes compartilhadas
export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

const BTN_BASE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[9px] border px-4 py-[9px] text-[12.5px] font-bold max-[819px]:min-h-10 disabled:cursor-not-allowed disabled:opacity-55";
const BTN_VARIANTS = {
  primary: "border-transparent bg-primary text-white hover:bg-navy",
  ghost: "border-transparent bg-line-soft text-ink-2 hover:bg-line",
  outline: "border-primary bg-surface text-link",
  amber: "border-transparent bg-accent text-on-accent",
  danger: "border-red-300 bg-surface text-red-700",
  glass: "border-white/40 bg-white/20 text-white",
  white: "border-transparent bg-surface text-title",
} as const;
export type BtnVariant = keyof typeof BTN_VARIANTS;
/** classes de botão — serve para <button> e para <Link> */
export const btn = (v: BtnVariant = "primary") => `${BTN_BASE} ${BTN_VARIANTS[v]}`;

const INPUT_BASE =
  "rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[13px] focus:border-primary focus:shadow-[0_0_0_3px_rgba(30,58,138,0.12)] focus:outline-none";
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
  const t = useT();
  const k = children.toUpperCase();
  const cor = VERDE.includes(k)
    ? "bg-ok-bg text-ok-fg"
    : AMBAR.includes(k)
      ? "bg-warn-bg text-warn-fg"
      : VERMELHO.includes(k)
        ? "bg-bad-bg text-bad-fg"
        : AZUL.includes(k)
          ? "bg-soft-blue text-link"
          : "bg-line-soft text-ink-2";
  return <span className={`inline-block rounded-full px-[9px] py-0.5 text-[10px] font-extrabold tracking-[0.02em] uppercase ${cor}`}>{t(children)}</span>;
}

export function MockTag({ children = "DADOS SIMULADOS", blue }: { children?: string; blue?: boolean }) {
  const t = useT();
  return (
    <span className={cx("ml-2 inline-block rounded-full px-2 py-px align-middle text-[9.5px] font-extrabold tracking-[0.03em]", blue ? "bg-soft-blue text-link" : "bg-warn-bg text-warn-fg")}>
      {t(children)}
    </span>
  );
}

export function PageHeader({ title, sub, actions, back = true }: { title: string; sub?: ReactNode; actions?: ReactNode; back?: boolean }) {
  const router = useRouter();
  const t = useT();
  return (
    <div className="mb-[18px] flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="m-0 text-[22px] font-extrabold tracking-[-0.01em] text-title">{title}</h1>
        {sub && <div className="mt-1 text-[12.5px] text-muted">{sub}</div>}
      </div>
      <div className="flex flex-wrap justify-end gap-2.5">
        {actions}
        {back && (
          <button type="button" className={btn("ghost")} onClick={() => router.back()}>
            {t("← Voltar")}
          </button>
        )}
      </div>
    </div>
  );
}

export function Card({ title, count, children, className = "" }: { title?: string; count?: number; children: ReactNode; className?: string }) {
  const t = useT();
  return (
    <section className={`overflow-hidden rounded-xl bg-surface shadow-card ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-line-soft px-5 py-4">
          <h3 className="m-0 text-sm font-bold">{t(title)}</h3>
          {count !== undefined && <span className="rounded-full bg-soft-blue px-2 py-0.5 text-[10.5px] font-bold text-link">{count}</span>}
        </header>
      )}
      {children}
    </section>
  );
}

const STAT_BORDER = { navy: "border-l-primary", green: "border-l-ok", amber: "border-l-amber", pink: "border-l-pink" } as const;
/** `to` torna o card inteiro um link (com o mesmo efeito de elevação dos ModuleCard) */
export function StatCard({ value, label, color, className = "", to }: { value: ReactNode; label: string; color: keyof typeof STAT_BORDER; className?: string; to?: string }) {
  const t = useT();
  const cls = `rounded-xl border-l-[3px] bg-surface px-5 py-[22px] shadow-card ${STAT_BORDER[color]} ${className}`;
  const corpo = (
    <>
      <div className="text-[26px] leading-[1.1] font-extrabold text-title">{value}</div>
      <div className="mt-1.5 text-[11px] font-semibold tracking-[0.03em] text-muted uppercase">{t(label)}</div>
    </>
  );
  return to ? (
    <Link href={to} className={`${cls} block transition hover:-translate-y-0.5 hover:shadow-lift`}>
      {corpo}
    </Link>
  ) : (
    <div className={cls}>{corpo}</div>
  );
}

export const StatGrid = ({ children }: { children: ReactNode }) => <div className="mb-[26px] grid grid-cols-1 gap-4 min-[820px]:grid-cols-2 min-[1100px]:grid-cols-4">{children}</div>;
export const ModuleGrid = ({ children, three }: { children: ReactNode; three?: boolean }) => (
  <div className={cx("mb-[26px] grid grid-cols-1 gap-4 min-[820px]:grid-cols-2", three ? "min-[1100px]:grid-cols-3" : "min-[1100px]:grid-cols-4")}>{children}</div>
);
export function SectionLabel({ children }: { children: string }) {
  const t = useT();
  return <div className="mb-3 text-[11px] font-bold tracking-[0.04em] text-muted uppercase">{t(children)}</div>;
}

export function ModuleCard({ icon, title, desc, to, tint }: { icon: string; title: string; desc: string; to: string; tint: string }) {
  const t = useT();
  return (
    <Link href={to} className="flex flex-col gap-1 rounded-xl bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
      <span className="mb-2 grid size-[42px] place-items-center rounded-[10px] text-[19px]" style={{ background: tint }}>
        {icon}
      </span>
      <strong className="text-[15px]">{t(title)}</strong>
      <span className="text-[11.5px] text-muted">{t(desc)}</span>
      <span className="mt-1.5 text-[11.5px] font-bold text-link">{t("Abrir listagem →")}</span>
    </Link>
  );
}

/** texto de interface (string) passa pelo dicionário; elementos seguem como estão */
const tx = (t: (k: string) => string, c: ReactNode) => (typeof c === "string" ? t(c) : c);

export function Empty({ children }: { children: ReactNode }) {
  const t = useT();
  return <div className="p-9 text-center text-muted">{tx(t, children)}</div>;
}
export function Loading() {
  const t = useT();
  return (
    <div role="status" aria-live="polite" className="p-9 text-center text-muted">
      {t("Carregando…")}
    </div>
  );
}
export function ErrorBox({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <div className="mb-3.5 rounded-[10px] bg-bad-bg px-3.5 py-[11px] text-[12.5px] font-semibold text-bad-fg" role="alert">
      {tx(t, children)}
    </div>
  );
}

/** linha "ícone + título + subtítulo + lado direito", usada nas listas do portal e nos painéis relacionados */
export function RowItem({ ico, tint = "var(--tint-blue)", title, sub, right, to }: { ico: string; tint?: string; title: string; sub: string; right?: ReactNode; to?: string }) {
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
    <Link href={to} className={`${cls} hover:bg-subtle`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function RelatedList({ title, items, footer }: { title: string; items: { icon: string; title: string; sub: string; to?: string }[]; footer?: { label: string; to: string; hint?: string } }) {
  const t = useT();
  return (
    <Card title={title} count={items.length}>
      {items.length === 0 && <Empty>Nada vinculado ainda.</Empty>}
      {items.map((it) => (
        <RowItem key={it.to ?? `${it.title}|${it.sub}`} ico={it.icon} title={it.title} sub={it.sub} to={it.to} />
      ))}
      {footer && (
        <Link href={footer.to} className="flex items-center justify-between border-t border-line-soft px-5 py-3.5 text-[12.5px] font-bold text-link">
          <span>{t(footer.label)}</span>
                  </Link>
      )}
    </Card>
  );
}

/** linha de chave/valor dos cartões de detalhe */
export function KV({ k, children }: { k: string; children: ReactNode }) {
  useT();
  return (
    <div className="flex justify-between gap-4 border-b border-line-soft px-5 py-3 last:border-b-0">
      <span className="text-[12px] text-muted">{rotulo(k)}</span>
      <b className="text-right text-[12.5px] font-semibold">{children}</b>
    </div>
  );
}

const HERO_BG = {
  navy: "from-navy to-primary",
  amber: "from-[#92400e] to-amber",
  green: "from-[#065f46] to-ok",
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
export function HeroBadges({ items }: { items: string[] }) {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((b) => (
        <span key={b} className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold">
          {t(b)}
        </span>
      ))}
    </div>
  );
}
export const DetailGrid = ({ children, even }: { children: ReactNode; even?: boolean }) => (
  <div className={cx("grid grid-cols-1 items-start gap-5", even ? "min-[1100px]:grid-cols-2" : "min-[1100px]:grid-cols-[1.1fr_1fr]")}>{children}</div>
);
