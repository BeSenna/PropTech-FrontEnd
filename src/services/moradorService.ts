// Adaptadores do MS Moradores (API real) + consultas auxiliares usadas em selects e listagens.
import { http, type Servico } from '@/services/http';
import type { Adapter, ListParams, Option, Paged, Rec } from '@/models/types';

export function makeApiAdapter(path: string, servico: Servico = 'morador'): Adapter {
  return {
    list: (p: ListParams) =>
      http<Paged>(path, {
        servico,
        query: { page: p.page, pageSize: p.pageSize, busca: p.busca, ...(p.filters ?? {}) },
      }),
    get: (id) => http<Rec>(`${path}/${id}`, { servico }),
    create: (v) => http<Rec>(path, { servico, method: 'POST', body: v }),
    update: (id, v) => http<Rec>(`${path}/${id}`, { servico, method: 'PATCH', body: v }),
    remove: (id) => http(`${path}/${id}`, { servico, method: 'DELETE' }),
  };
}

export const blocoApi = makeApiAdapter('/bloco');
export const imovelApi = makeApiAdapter('/imovel');
export const moradorApi = makeApiAdapter('/morador');
export const vinculoApi = makeApiAdapter('/morador-imovel');
export const usuarioApi = makeApiAdapter('/usuario');

export const encerrarVinculo = (id: number, dataFim: string) =>
  http(`/morador-imovel/${id}/encerrar`, { method: 'PATCH', body: { moradorImovelDataFim: dataFim } });

export const criarUsuario = (dados: { usuarioLogin: string; senha: string; usuarioPerfil: 'SINDICO' | 'MORADOR'; moradorImovelId?: number }) =>
  http('/usuario', { method: 'POST', body: dados });

export const trocarSenha = (id: number, novaSenha: string) =>
  http(`/usuario/${id}/senha`, { method: 'PATCH', body: { novaSenha } });

// ---- helpers de rótulo ----
export const imovelRotulo = (i: Rec, blocoNome?: string) =>
  `${i.imovelTipo === 'COBERTURA' ? 'Cob.' : 'Apto'} ${i.imovelNumero}${blocoNome ?? i.bloco?.blocoNome ? ` · ${blocoNome ?? i.bloco.blocoNome}` : ''}`;

export const blocoLetra = (nome?: string) => (nome ?? '').replace(/^bloco\s+/i, '') || '—';

// ---- cache curto: evita refazer a mesma consulta a cada tela ----
const cache = new Map<string, { t: number; v: unknown }>();
async function memo<T>(key: string, fn: () => Promise<T>, ttl = 15_000): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.v as T;
  const v = await fn();
  cache.set(key, { t: Date.now(), v });
  return v;
}
export const limparCache = () => cache.clear();

export async function todos(path: string, extra: Record<string, string | number> = {}, servico: Servico = 'morador'): Promise<Rec[]> {
  return memo(`all:${servico}:${path}:${JSON.stringify(extra)}`, async () => {
    const r = await http<Paged>(path, { servico, query: { page: 1, pageSize: 500, ...extra } });
    return r.data;
  });
}

export const getBlocoMap = async (): Promise<Record<number, string>> => {
  const b = await todos('/bloco');
  return Object.fromEntries(b.map((x) => [x.blocoId, x.blocoNome]));
};

export const loadBlocoOptions = async (): Promise<Option[]> =>
  (await todos('/bloco', { status: 1 })).map((b) => ({ value: b.blocoId, label: b.blocoNome }));

export const loadMoradorOptions = async (): Promise<Option[]> =>
  (await todos('/morador', { status: 1 })).map((m) => ({ value: m.moradorId, label: m.moradorNome }));

// Relações ativas que ainda não têm conta de login (usadas ao criar um usuário MORADOR).
export const loadRelacaoSemContaOptions = async (): Promise<Option[]> => {
  const [rels, blocos] = await Promise.all([todos('/morador-imovel', { status: 1 }), getBlocoMap()]);
  return rels
    .filter((r) => !r.usuarioId && r.estado !== 'ENCERRADO')
    .map((r) => ({
      value: r.moradorImovelId,
      label: `${r.morador?.moradorNome ?? `Morador #${r.moradorId}`} · Apto ${r.imovel?.imovelNumero ?? r.imovelId} · ${blocos[r.imovel?.blocoId] ?? 'Bloco —'} · ${r.moradorImovelTipoRelacao}`,
    }));
};

export const loadImovelOptions = async (): Promise<Option[]> => {
  const [imoveis, blocos] = await Promise.all([todos('/imovel', { status: 1 }), getBlocoMap()]);
  return imoveis.map((i) => ({ value: i.imovelId, label: imovelRotulo(i, blocos[i.blocoId]) }));
};

export async function totalDe(path: string, filters: Record<string, string | number | undefined> = {}, servico: Servico = 'morador'): Promise<number> {
  const r = await http<Paged>(path, { servico, query: { page: 1, pageSize: 1, ...filters } });
  return r.total;
}

// morador -> vínculos (usado na coluna "Relação" da lista de moradores)
export async function vinculosPorMorador(): Promise<Record<number, Rec[]>> {
  const [vs, blocos] = await Promise.all([todos('/morador-imovel'), getBlocoMap()]);
  const m: Record<number, Rec[]> = {};
  for (const v of vs) {
    (m[v.moradorId] ??= []).push({ ...v, blocoNome: blocos[v.imovel?.blocoId] });
  }
  return m;
}
