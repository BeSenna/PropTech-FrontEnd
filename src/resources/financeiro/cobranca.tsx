import { competenciaTxt, fmtDate, fmtDateTime, fmtMoney, toDateInput } from '@/lib/format';
import type { Rec, ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { cobrancaApi, comImovel } from '@/services/financeiroService';
import type { Adapter } from '@/models/types';
import { loadImovelOptions } from '@/services/moradorService';
import { idFmt, ativoTxt, sv, vazio } from '../moradores/shared';
import { radio, status } from '../simulados/shared';

const SITUACOES = ['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO'];

// A competência é sempre o dia 01 (a restrição única do banco considera a data inteira).
const primeiroDia = (data: string) => `${String(data).slice(0, 7)}-01`;

// O detalhe e o formulário chamam get() direto (sem enrich): aqui o rótulo do imóvel também é acrescentado.
const adapter: Adapter = {
  ...cobrancaApi,
  get: async (id) => (await comImovel([await cobrancaApi.get(id)], (r) => r.imovelId))[0]!,
};

// ---------------------------------------------------------------- Cobranças (MS Financeiro, API real)
export const cobrancaCfg: ResourceConfig = {
  key: 'cobranca',
  path: '/cobrancas',
  singular: 'cobrança',
  plural: 'Cobranças',
  gender: 'f',
  endpoint: 'GET /cobrancas',
  idKey: 'id',
  adapter,
  enrich: (rows) => comImovel(rows, (r) => r.imovelId),
  columns: [
    { key: '_imovel', label: 'Imóvel', strong: true, sortValue: sv((r) => r._imovel) },
    { key: '_bloco', label: 'Bloco' },
    { key: 'competencia', label: 'Competência', render: (r) => competenciaTxt(r.competencia), sortValue: sv((r) => r.competencia) },
    { key: 'valor', label: 'Valor', render: (r) => fmtMoney(r.valor), sortValue: sv((r) => Number(r.valor)) },
    { key: 'vencimento', label: 'Vencimento', render: (r) => fmtDate(r.vencimento), sortValue: sv((r) => r.vencimento) },
    { key: 'situacao', label: 'Situação', render: (r) => <Badge>{r.situacao}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.status)}</Badge> },
  ],
  chips: [{ label: 'Todas', filters: {} }, ...SITUACOES.map((t) => ({ label: t[0] + t.slice(1).toLowerCase(), filters: { situacao: t } }))],
  searchable: true,
  searchPlaceholder: 'Buscar pela descrição...',
  urlFilters: ['imovelId'],
  // o Financeiro só guarda o id do imóvel; o filtro por imóvel é feito no servidor (escala melhor que buscar o texto)
  selectFilters: [{ param: 'imovelId', label: 'Imóvel', load: loadImovelOptions }],
  fields: [
    { name: 'imovelId', label: 'Imóvel', col: 'imovel_id', type: 'select', required: true, loadOptions: loadImovelOptions },
    { name: 'descricao', label: 'Descrição', col: 'cobranca_descricao', type: 'text', required: true, maxLength: 255, placeholder: 'Taxa condominial ordinária' },
    { name: 'competencia', label: 'Competência', col: 'cobranca_competencia', type: 'date', required: true, half: true, fkNote: 'Vale o mês; o dia é ajustado para 01.' },
    { name: 'vencimento', label: 'Vencimento', col: 'cobranca_vencimento', type: 'date', required: true, half: true },
    { name: 'valor', label: 'Valor', col: 'cobranca_valor', type: 'money', required: true, half: true, placeholder: '850,00' },
    {
      name: 'situacao',
      label: 'Situação',
      col: 'cobranca_tipo',
      type: 'radio',
      options: radio(SITUACOES),
      fkNote: 'Muda sozinha ao registrar pagamentos: vira PAGO quando a soma cobre o valor.',
    },
    status('status', 'Cobrança ativa', 'Inativas não aparecem nas buscas padrão'),
  ],
  formSubtitle: '',
  defaults: { imovelId: '', descricao: 'Taxa condominial ordinária', competencia: '', vencimento: '', valor: '', situacao: 'PENDENTE', status: 1 },
  toForm: (r) => ({
    imovelId: r.imovelId,
    descricao: r.descricao ?? '',
    competencia: toDateInput(r.competencia),
    vencimento: toDateInput(r.vencimento),
    valor: r.valor,
    situacao: r.situacao,
    status: r.status,
  }),
  toPayload: (v) => ({
    imovelId: Number(v.imovelId),
    descricao: v.descricao,
    competencia: primeiroDia(v.competencia),
    vencimento: v.vencimento,
    valor: v.valor,
    situacao: v.situacao,
    status: v.status,
  }),
  rowTitle: (r) => `Cobrança · ${r._imovel ?? `Imóvel #${r.imovelId}`}`,
  idLabel: (r) => `Código ${idFmt(r.id)}`,
  hasDetail: true,
  hero: {
    kind: 'COBRANÇA',
    color: 'navy',
    badges: (r) => [r.situacao],
    sub: (r) => `${fmtMoney(r.valor)} · vence em ${fmtDate(r.vencimento)}`,
  },
  detailTitle: 'Dados da cobrança',
  detailRows: (r) => [
    ['imovel', `${r._imovel ?? `Imóvel #${r.imovelId}`}${r._bloco ? ` · Bloco ${r._bloco}` : ''}`],
    ['cobranca_descricao', vazio(r.descricao)],
    ['cobranca_competencia', fmtDate(r.competencia)],
    ['cobranca_valor', fmtMoney(r.valor)],
    ['cobranca_vencimento', fmtDate(r.vencimento)],
    ['cobranca_tipo', r.situacao],
    ['cobranca_data_criacao', fmtDateTime(r.dataCriacao)],
    ['cobranca_status', r.status === 1 ? 'Ativo' : 'Inativo'],
    ['boleto_linha_digitavel', vazio(r.boleto?.linhaDigitavel)],
    ['boleto_codigo_barras', vazio(r.boleto?.codigoBarras)],
    ['boleto_data_emissao', fmtDate(r.boleto?.dataEmissao)],
  ],
  // cobrança inativa não recebe boleto novo nem pagamento
  detailActions: (r) => r.status === 0 ? [] : [r.boleto ? { label: 'Editar boleto', to: `/boletos/${r.boleto.id}/editar` } : { label: 'Cadastrar boleto', to: `/boletos/novo?cobrancaId=${r.id}` }],
  related: (r) => {
    const pagamentos: Rec[] = r.pagamentos ?? [];
    return {
      title: 'Pagamentos vinculados',
      items: pagamentos.map((p) => ({
        icon: '💳',
        title: `${fmtMoney(p.valorPago)} · ${p.formaPagamento}${p.status === 0 ? ' (cancelado)' : ''}`,
        sub: `Pago em ${fmtDate(p.dataPagamento)}`,
        to: `/pagamentos/${p.id}/editar`,
      })),
      footer: r.status !== 0 && (r.situacao === 'PENDENTE' || r.situacao === 'VENCIDO') ? { label: '+ Registrar pagamento', to: `/pagamentos/novo?cobrancaId=${r.id}` } : undefined,
    };
  },
  statusOf: (r) => r.status,
  inactivate: { label: 'Cancelar cobrança', confirm: 'A cobrança ficará inativa e sairá das buscas padrão.' },
};
