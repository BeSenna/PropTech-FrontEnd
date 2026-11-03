import { iniciais } from '@/lib/format';
import type { Rec } from '@/models/types';

// Configuração dos recursos do MS Moradores (API real).

export const idFmt = (n: number) => `#${String(n).padStart(4, '0')}`;
export const ativoTxt = (v: number, f = 'ATIVO', i = 'INATIVO') => (v === 1 ? f : i);
export const vazio = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v));
export const sv = (fn: (r: Rec) => string | number) => fn;
export const quem = (nome: string) => (
  <div className="flex items-center gap-2.5 font-bold">
    <i className="grid size-7 place-items-center rounded-lg bg-soft-blue text-[11px] font-extrabold text-primary not-italic">{iniciais(nome)}</i>
    {nome}
  </div>
);
