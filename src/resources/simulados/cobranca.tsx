import { competenciaTxt, fmtDate, fmtDateTime, fmtMoney } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { loadImovelOptions } from '@/services/moradorService';
import { cobrancaStore, pagamentoStore } from '@/mock/data';
import { idFmt, ativoTxt, vazio, agora, radio, status, quebraImovel } from './shared';

// ---------------------------------------------------------------- Cobranças
export const cobrancaCfg: ResourceConfig = {
  key: 'cobranca',
  path: '/cobrancas',
  singular: 'cobrança',
  plural: 'Cobranças',
  gender: 'f',
  endpoint: 'GET /cobranca',
  idKey: 'id',
  adapter: cobrancaStore,
  columns: [
    { key: 'imovel_label', label: 'Imóvel', strong: true },
    { key: 'bloco_nome', label: 'Bloco' },
    { key: 'cobranca_competencia', label: 'Competência', render: (r) => competenciaTxt(r.cobranca_competencia), sortValue: (r) => r.cobranca_competencia },
    { key: 'cobranca_valor', label: 'Valor', render: (r) => fmtMoney(r.cobranca_valor), sortValue: (r) => r.cobranca_valor },
    { key: 'cobranca_vencimento', label: 'Vencimento', render: (r) => fmtDate(r.cobranca_vencimento), sortValue: (r) => r.cobranca_vencimento },
    { key: 'cobranca_tipo', label: 'Tipo', render: (r) => <Badge>{r.cobranca_tipo}</Badge> },
    { key: 'cobranca_status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.cobranca_status)}</Badge> },
  ],
  chips: [{ label: 'Todas', filters: {} }, ...['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO'].map((t) => ({ label: t[0] + t.slice(1).toLowerCase(), filters: { cobranca_tipo: t } }))],
  searchable: true,
  searchPlaceholder: 'Buscar por imóvel ou competência...',
  fields: [
    { name: 'imovel_id', label: 'Imóvel', col: 'imovel_id (FK)', type: 'select', required: true, loadOptions: loadImovelOptions },
    { name: 'cobranca_descricao', label: 'Descrição', col: 'cobranca_descricao', type: 'text', required: true, placeholder: 'Taxa condominial ordinária' },
    { name: 'cobranca_competencia', label: 'Competência', col: 'cobranca_competencia', type: 'date', required: true, half: true },
    { name: 'cobranca_vencimento', label: 'Vencimento', col: 'cobranca_vencimento', type: 'date', required: true, half: true },
    { name: 'cobranca_valor', label: 'Valor', col: 'cobranca_valor', type: 'money', required: true, half: true, placeholder: '850,00' },
    { name: 'cobranca_tipo', label: 'Tipo', col: 'cobranca_tipo', type: 'radio', options: radio(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']) },
    status('cobranca_status', 'Cobrança ativa', 'Inativas não aparecem nas buscas padrão'),
  ],
  formSubtitle: '',
  defaults: { imovel_id: '', cobranca_descricao: 'Taxa condominial ordinária', cobranca_competencia: '', cobranca_vencimento: '', cobranca_valor: '', cobranca_tipo: 'PENDENTE', cobranca_status: 1 },
  toForm: (r) => ({ ...r }),
  toPayload: (v, mode) => ({
    ...v,
    ...(v.imovel_id__label ? quebraImovel(v.imovel_id__label) : {}),
    ...(mode === 'create'
      ? {
          cobranca_data_criacao: agora(),
          boleto_linha_digitavel: '3419.8172 6009.0128 3000.0000 5 9' + String(Math.round(Number(v.cobranca_valor) * 100)).padStart(5, '0'),
          boleto_data_emissao: v.cobranca_competencia,
        }
      : {}),
  }),
  rowTitle: (r) => `Cobrança · ${r.imovel_label}`,
  idLabel: (r) => `Código ${idFmt(r.id)}`,
  hasDetail: true,
  hero: {
    kind: 'COBRANÇA',
    color: 'navy',
    badges: (r) => [r.cobranca_tipo],
    sub: (r) => `${fmtMoney(r.cobranca_valor)} · vence em ${fmtDate(r.cobranca_vencimento)}`,
  },
  detailTitle: 'Dados da cobrança',
  detailRows: (r) => [
    ['imovel', `${r.imovel_label} · Bloco ${r.bloco_nome}`],
    ['cobranca_descricao', r.cobranca_descricao],
    ['cobranca_competencia', fmtDate(r.cobranca_competencia)],
    ['cobranca_valor', fmtMoney(r.cobranca_valor)],
    ['cobranca_vencimento', fmtDate(r.cobranca_vencimento)],
    ['cobranca_tipo', r.cobranca_tipo],
    ['cobranca_data_criacao', fmtDateTime(r.cobranca_data_criacao)],
    ['cobranca_status', r.cobranca_status === 1 ? 'Ativo' : 'Inativo'],
    ['boleto_linha_digitavel', vazio(r.boleto_linha_digitavel)],
    ['boleto_data_emissao', fmtDate(r.boleto_data_emissao)],
  ],
  related: (r) => ({
    title: 'Pagamentos vinculados',
    items: pagamentoStore
      .all()
      .filter((p) => p.cobranca_id === r.id)
      .map((p) => ({ icon: '💳', title: `${fmtMoney(p.pagamento_valor_pago)} · ${p.pagamento_forma_pagamento}`, sub: `Pago em ${fmtDate(p.pagamento_data_pagamento)}`, to: `/pagamentos/${p.id}/editar` })),
    footer: { label: '+ Registrar pagamento', to: `/pagamentos/novo?cobranca_id=${r.id}` },
  }),
  statusOf: (r) => r.cobranca_status,
  inactivate: { label: 'Cancelar cobrança', confirm: 'A cobrança ficará inativa e sairá das buscas padrão.' },
  mockTag: true,
};
