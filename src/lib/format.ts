export const onlyDigits = (s: string) => (s ?? '').replace(/\D/g, '');

export function fmtDate(v?: string | null): string {
  if (!v) return '—';
  const s = String(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('pt-BR');
}

export function fmtDateTime(v?: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export const toDateInput = (v?: string | null) => (v ? String(v).slice(0, 10) : '');

export function fmtMoney(v: unknown): string {
  const n = Number(v);
  if (!isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmtCpf(v?: string | null): string {
  const d = onlyDigits(v ?? '');
  if (d.length !== 11) return v || '—';
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function fmtArea(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  return isFinite(n) ? `${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²` : String(v);
}

export const iniciais = (nome?: string) =>
  (nome ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

export const andarTxt = (a?: number | null) => (a === null || a === undefined ? '' : ` · ${a}º andar`);

export const competenciaTxt = (iso?: string | null) => {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  if (!m) return String(iso);
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${nomes[Number(m[2]) - 1]}/${m[1]}`;
};

export const hoje = () => new Date().toISOString().slice(0, 10);
