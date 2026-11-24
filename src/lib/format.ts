import { ingles, localeAtual, t } from '@/i18n';

export const onlyDigits = (s: string) => (s ?? '').replace(/\D/g, '');

// Em português: DD/MM/AAAA. Em inglês: "Mar 12, 2021" (sem ambiguidade entre dia e mês).
const DATA_EN: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

export function fmtDate(v?: string | null): string {
  if (!v) return '—';
  const s = String(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return ingles() ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('en-US', DATA_EN) : `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString(localeAtual(), ingles() ? DATA_EN : undefined);
}

export function fmtDateTime(v?: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return `${d.toLocaleDateString(localeAtual(), ingles() ? DATA_EN : undefined)} ${d.toLocaleTimeString(localeAtual(), { hour: '2-digit', minute: '2-digit' })}`;
}

export const toDateInput = (v?: string | null) => (v ? String(v).slice(0, 10) : '');

// ---- Datas no padrão brasileiro (DD/MM/AAAA) nos formulários.
// O <input type="date"> do navegador segue o idioma do navegador (em inglês fica MM/DD/YYYY),
// então os campos 'data-br' usam texto com máscara e guardam a data em ISO (AAAA-MM-DD), como o backend espera.
export const isoToBr = (iso?: string | null) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
};

export function maskDataBr(s: string): string {
  const d = onlyDigits(s).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

// 'DD/MM/AAAA' -> 'AAAA-MM-DD'; null se incompleta ou se a data não existe (31/02, 29/02 em ano comum...).
export function brToIso(s: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s ?? '');
  if (!m) return null;
  const dia = Number(m[1]), mes = Number(m[2]), ano = Number(m[3]);
  if (ano < 1900) return null;
  const d = new Date(ano, mes - 1, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// Para o `validate` dos campos 'data-br': o valor é ISO quando a data digitada é válida; senão continua o texto digitado.
export const validarDataBr = (v: unknown): string | null => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? null : t('Data inválida. Use o formato DD/MM/AAAA.'));

export function fmtMoney(v: unknown): string {
  const n = Number(v);
  if (!isFinite(n)) return '—';
  return n.toLocaleString(localeAtual(), { style: 'currency', currency: 'BRL' });
}

// Mesma regra do backend: 11 dígitos, não repetidos, com os dois dígitos verificadores corretos.
export function cpfValido(v?: string | null): boolean {
  const d = onlyDigits(v ?? '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (base: string, peso: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (peso - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(d.slice(0, 9), 10) === Number(d[9]) && dv(d.slice(0, 10), 11) === Number(d[10]);
}

export function fmtCpf(v?: string | null): string {
  const d = onlyDigits(v ?? '');
  if (d.length !== 11) return v || '—';
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function fmtArea(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  return isFinite(n) ? `${n.toLocaleString(localeAtual(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²` : String(v);
}

export const iniciais = (nome?: string) =>
  (nome ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

const ordinalEn = (n: number) => {
  const r = n % 100;
  if (r >= 11 && r <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
};
export const andarTxt = (a?: number | null) => (a === null || a === undefined ? '' : ingles() ? ` · ${ordinalEn(a)} floor` : ` · ${a}º andar`);

export const competenciaTxt = (iso?: string | null) => {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  if (!m) return String(iso);
  const nomes = ingles() ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${nomes[Number(m[2]) - 1]}/${m[1]}`;
};

// Data de hoje no fuso do navegador (toISOString usa UTC: no Brasil, depois das 21h já devolveria o dia seguinte).
export const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
