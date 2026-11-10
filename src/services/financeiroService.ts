// Adaptadores do MS Financeiro (API real) + consultas auxiliares usadas em selects, listas e totais.
import { competenciaTxt, fmtMoney } from '@/lib/format';
import type { Option, Paged, Rec } from '@/models/types';
import { http } from '@/services/http';
import { blocoLetra, getBlocoMap, imovelRotulo, makeApiAdapter, todos } from '@/services/moradorService';

export const cobrancaApi = makeApiAdapter('/cobrancas', 'financeiro');
export const boletoApi = makeApiAdapter('/boletos', 'financeiro');
export const pagamentoApi = makeApiAdapter('/pagamentos', 'financeiro');
export const receitaApi = makeApiAdapter('/receitas', 'financeiro');
export const despesaApi = makeApiAdapter('/despesas', 'financeiro');

const fin = (path: string, extra: Record<string, string | number> = {}) => todos(path, extra, 'financeiro');

// ---------------------------------------------------------------- imóvel (rótulo vem do MS Moradores)
export interface ImovelInfo {
  rotulo: string; // "Apto 101"
  bloco: string; // "A"
}

/** imovelId → "Apto 101" + letra do bloco. A API do Financeiro só guarda o id do imóvel. */
export async function imoveisPorId(): Promise<Record<number, ImovelInfo>> {
  const [imoveis, blocos] = await Promise.all([todos('/imovel'), getBlocoMap()]);
  return Object.fromEntries(
    imoveis.map((i) => [i.imovelId, { rotulo: imovelRotulo(i, '').replace(/ · .*$/, ''), bloco: blocoLetra(blocos[i.blocoId]) }]),
  );
}

/** Acrescenta _imovel e _bloco às linhas. `chave` diz onde está o imovelId (ex.: 'cobranca.imovelId'). */
export async function comImovel(rows: Rec[], chave: (r: Rec) => number | undefined): Promise<Rec[]> {
  const mapa = await imoveisPorId();
  return rows.map((r) => {
    const id = chave(r);
    const i = id !== undefined ? mapa[id] : undefined;
    return { ...r, _imovel: i?.rotulo ?? (id !== undefined ? `Imóvel #${id}` : '—'), _bloco: i?.bloco ?? '—' };
  });
}

// ---------------------------------------------------------------- selects
export const cobrancaRotulo = (c: Rec, imoveis: Record<number, ImovelInfo>) =>
  `${imoveis[c.imovelId]?.rotulo ?? `Imóvel #${c.imovelId}`} · ${competenciaTxt(c.competencia)} · ${fmtMoney(c.valor)}`;

/** Cobranças ativas que ainda aceitam pagamento (não pagas nem canceladas). */
export const loadCobrancaAbertaOptions = async (): Promise<Option[]> => {
  const [cobrancas, imoveis] = await Promise.all([fin('/cobrancas', { status: 1 }), imoveisPorId()]);
  return cobrancas.filter((c) => c.situacao === 'PENDENTE' || c.situacao === 'VENCIDO').map((c) => ({ value: c.id, label: cobrancaRotulo(c, imoveis) }));
};

/** Cobranças ativas que ainda não têm boleto. */
export const loadCobrancaSemBoletoOptions = async (): Promise<Option[]> => {
  const [cobrancas, imoveis] = await Promise.all([fin('/cobrancas', { status: 1 }), imoveisPorId()]);
  return cobrancas.filter((c) => !c.boleto && c.situacao !== 'CANCELADO').map((c) => ({ value: c.id, label: cobrancaRotulo(c, imoveis) }));
};

// ---------------------------------------------------------------- totais do painel do síndico
const arredonda = (n: number) => Math.round(n * 100) / 100;

async function somar(path: string, campo: string, extra: Record<string, string | number> = {}) {
  const r = await http<Paged>(path, { servico: 'financeiro', query: { page: 1, pageSize: 500, status: 1, ...extra } });
  return { soma: arredonda(r.data.reduce((s, x) => s + Number(x[campo] || 0), 0)), parcial: r.total > r.data.length };
}

export interface ResumoFinanceiro {
  pendentes: number;
  recebido: number;
  despesas: number;
  receitas: number;
  /** true quando há mais de 500 registros e o total mostra só os 500 mais recentes */
  parcial: boolean;
}

export async function resumoFinanceiro(): Promise<ResumoFinanceiro> {
  const [pend, venc, rec, desp, rece] = await Promise.all([
    somar('/cobrancas', 'valor', { situacao: 'PENDENTE' }),
    somar('/cobrancas', 'valor', { situacao: 'VENCIDO' }),
    somar('/pagamentos', 'valorPago'),
    somar('/despesas', 'valor'),
    somar('/receitas', 'valor'),
  ]);
  return {
    pendentes: arredonda(pend.soma + venc.soma),
    recebido: rec.soma,
    despesas: desp.soma,
    receitas: rece.soma,
    parcial: [pend, venc, rec, desp, rece].some((x) => x.parcial),
  };
}
