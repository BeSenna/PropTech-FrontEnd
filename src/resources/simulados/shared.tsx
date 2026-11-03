import type { FieldDef, Option, Rec } from '@/models/types';
import { blocoLetra } from '@/services/moradorService';

// Recursos dos módulos Financeiro e Serviços (dados simulados no navegador).
// Os nomes internos dos campos seguem as colunas do banco do futuro microsserviço (não aparecem na tela).

export const idFmt = (n: number) => `#${String(n).padStart(4, '0')}`;
export const ativoTxt = (v: number, f = 'ATIVO', i = 'INATIVO') => (v === 1 ? f : i);
export const vazio = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v));
export const agora = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
export const radio = (xs: string[]): Option[] => xs.map((x) => ({ value: x, label: x }));
export const horario = (r: Rec) => `${String(r.reserva_horario_inicio).slice(0, 2).replace(/^0/, '')}h – ${String(r.reserva_horario_fim).slice(0, 2).replace(/^0/, '')}h`;

export const status = (name: string, titulo: string, hint: string): FieldDef => ({ name, label: 'Status', col: name, type: 'toggle', toggleTitle: titulo, toggleHint: hint });

// Separa "Apto 101 · Bloco A" em rótulo + letra do bloco
export const quebraImovel = (label?: string) => {
  const [im, bl] = String(label ?? '').split(' · ');
  return { imovel_label: im || '—', bloco_nome: blocoLetra(bl) };
};

export const optsDe = (store: { all(): Rec[] }, label: (r: Rec) => string, onlyActive?: string) => async (): Promise<Option[]> =>
  store
    .all()
    .filter((r) => !onlyActive || r[onlyActive] === 1)
    .map((r) => ({ value: r.id, label: label(r) }));
