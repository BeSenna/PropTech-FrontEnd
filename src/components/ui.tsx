import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const VERDE = ['ATIVO', 'ATIVA', 'CONFIRMADO', 'CONFIRMADA', 'PAGO', 'CONCLUIDA', 'FINALIZADA', 'COM LOGIN', 'SINDICO'];
const AMBAR = ['PENDENTE', 'ABERTA', 'ENCERRANDO', 'EM_EXECUCAO', 'EM_ANDAMENTO', 'TEMPORADA'];
const VERMELHO = ['VENCIDO', 'CANCELADO', 'CANCELADA'];
const AZUL = ['PROPRIETARIO', 'INQUILINO', 'MORADOR', 'APARTAMENTO', 'COBERTURA', 'PIX', 'BOLETO', 'CARTAO'];

export function Badge({ children }: { children: string }) {
  const k = children.toUpperCase();
  const cls = VERDE.includes(k) ? 'b-green' : AMBAR.includes(k) ? 'b-amber' : VERMELHO.includes(k) ? 'b-red' : AZUL.includes(k) ? 'b-blue' : 'b-gray';
  return <span className={`badge ${cls}`}>{children}</span>;
}

export function PageHeader({
  title,
  sub,
  actions,
  back = true,
}: {
  title: string;
  sub?: ReactNode;
  actions?: ReactNode;
  back?: boolean;
}) {
  const nav = useNavigate();
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <div className="head-actions">
        {actions}
        {back && (
          <button type="button" className="btn btn-ghost" onClick={() => nav(-1)}>
            ← Voltar
          </button>
        )}
      </div>
    </div>
  );
}

export function Card({ title, count, children, className = '' }: { title?: string; count?: number; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <header className="card-head">
          <h3>{title}</h3>
          {count !== undefined && <span className="count-pill">{count}</span>}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({ value, label, color }: { value: ReactNode; label: string; color: 'navy' | 'green' | 'amber' | 'pink' }) {
  return (
    <div className={`stat stat-${color}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function ModuleCard({ icon, title, desc, to, tint }: { icon: string; title: string; desc: string; to: string; tint: string }) {
  return (
    <Link to={to} className="module">
      <span className="module-ico" style={{ background: tint }}>
        {icon}
      </span>
      <strong>{title}</strong>
      <span className="module-desc">{desc}</span>
      <span className="module-link">Abrir listagem →</span>
    </Link>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div className="errbox" role="alert">
      {children}
    </div>
  );
}

export function Loading() {
  return <div className="loading">Carregando…</div>;
}

export function RelatedList({
  title,
  items,
  footer,
}: {
  title: string;
  items: { icon: string; title: string; sub: string; to?: string }[];
  footer?: { label: string; to: string; hint?: string };
}) {
  return (
    <Card title={title} count={items.length}>
      {items.length === 0 && <Empty>Nada vinculado ainda.</Empty>}
      {items.map((it, i) => {
        const inner = (
          <>
            <span className="rel-ico">{it.icon}</span>
            <span>
              <strong>{it.title}</strong>
              <small>{it.sub}</small>
            </span>
          </>
        );
        return it.to ? (
          <Link key={i} to={it.to} className="rel-item">
            {inner}
          </Link>
        ) : (
          <div key={i} className="rel-item">
            {inner}
          </div>
        );
      })}
      {footer && (
        <Link to={footer.to} className="rel-footer">
          <span>{footer.label}</span>
          {footer.hint && <small>{footer.hint}</small>}
        </Link>
      )}
    </Card>
  );
}
