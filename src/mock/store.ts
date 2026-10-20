// Armazenamento simulado (localStorage) para os módulos Financeiro e Serviços,
// cujos microsserviços ainda não existem. Mesma interface (Adapter) da API real,
// então trocar por chamadas HTTP depois não muda nenhuma tela.
import type { Adapter, ListParams, Paged, Rec } from '../lib/types';

const PREFIX = 'proptech.mock.v1.';
const memoria = new Map<string, Rec[]>();

function ler(nome: string, seed: () => Rec[]): Rec[] {
  if (memoria.has(nome)) return memoria.get(nome)!;
  let dados: Rec[] | null = null;
  try {
    const raw = localStorage.getItem(PREFIX + nome);
    if (raw) dados = JSON.parse(raw) as Rec[];
  } catch {
    dados = null;
  }
  if (!dados) {
    dados = seed().map((r, i) => ({ id: i + 1, ...r }));
    gravar(nome, dados);
  }
  memoria.set(nome, dados);
  return dados;
}

function gravar(nome: string, dados: Rec[]) {
  memoria.set(nome, dados);
  try {
    localStorage.setItem(PREFIX + nome, JSON.stringify(dados));
  } catch {
    /* sem storage: fica só em memória */
  }
}

export interface MockAdapter extends Adapter {
  all(): Rec[];
  count(filters?: Record<string, string | number | undefined>): number;
  insertMany(rows: Rec[]): void;
}

export function createMock(nome: string, seed: () => Rec[], searchKeys: string[], statusKey?: string): MockAdapter {
  const all = () => ler(nome, seed);
  const filtrar = (p: { busca?: string; filters?: Record<string, string | number | undefined> }) => {
    const b = p.busca?.trim().toLowerCase();
    return all().filter((r) => {
      for (const [k, v] of Object.entries(p.filters ?? {})) {
        if (v === undefined || v === '') continue;
        if (String(r[k]) !== String(v)) return false;
      }
      if (b && !searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(b))) return false;
      return true;
    });
  };
  return {
    all,
    count: (filters) => filtrar({ filters }).length,
    insertMany(rows) {
      const dados = [...all()];
      let next = dados.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      for (const r of rows) dados.unshift({ id: next++, ...r });
      gravar(nome, dados);
    },
    async list(p: ListParams): Promise<Paged> {
      const page = p.page && p.page > 0 ? p.page : 1;
      const pageSize = p.pageSize && p.pageSize > 0 ? p.pageSize : 10;
      const rows = filtrar(p);
      return {
        data: rows.slice((page - 1) * pageSize, page * pageSize),
        total: rows.length,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(rows.length / pageSize)),
      };
    },
    async get(id) {
      const r = all().find((x) => String(x.id) === String(id));
      if (!r) throw new Error(`Registro #${id} não encontrado.`);
      return r;
    },
    async create(v) {
      const dados = [...all()];
      const id = dados.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      const novo = { id, ...v };
      dados.unshift(novo);
      gravar(nome, dados);
      return novo;
    },
    async update(id, v) {
      const dados = all().map((r) => (String(r.id) === String(id) ? { ...r, ...v } : r));
      gravar(nome, dados);
      return dados.find((r) => String(r.id) === String(id))!;
    },
    async remove(id) {
      // soft delete, igual ao backend real: marca *_status = 0
      if (statusKey) {
        gravar(
          nome,
          all().map((r) => (String(r.id) === String(id) ? { ...r, [statusKey]: 0 } : r)),
        );
      } else {
        gravar(
          nome,
          all().filter((r) => String(r.id) !== String(id)),
        );
      }
    },
  };
}

export function resetMocks() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  memoria.clear();
}
