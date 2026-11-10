import { competenciaTxt, fmtDate, fmtMoney, toDateInput } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { comImovel, loadCobrancaAbertaOptions, pagamentoApi } from '@/services/financeiroService';
import { loadImovelOptions } from '@/services/moradorService';
import { idFmt, sv } from '../moradores/shared';
import { radio, status } from '../simulados/shared';

const FORMAS = ['PIX', 'BOLETO', 'CARTAO', 'TRANSFERENCIA', 'DINHEIRO', 'OUTRO'];

// ---------------------------------------------------------------- Pagamentos (MS Financeiro, API real)
export const pagamentoCfg: ResourceConfig = {
  key: 'pagamento',
  path: '/pagamentos',
  singular: 'pagamento',
  plural: 'Pagamentos',
  gender: 'm',
  endpoint: 'GET /pagamentos',
  idKey: 'id',
  adapter: pagamentoApi,
  enrich: (rows) => comImovel(rows, (r) => r.cobranca?.imovelId),
  columns: [
    { key: '_competencia', label: 'Cobrança', strong: true, render: (r) => competenciaTxt(r.cobranca?.competencia), sortValue: sv((r) => r.cobranca?.competencia ?? '') },
    { key: '_imovel', label: 'Imóvel', sortValue: sv((r) => r._imovel) },
    { key: '_bloco', label: 'Bloco' },
    { key: 'valorPago', label: 'Valor pago', render: (r) => fmtMoney(r.valorPago), sortValue: sv((r) => Number(r.valorPago)) },
    { key: 'dataPagamento', label: 'Data', render: (r) => fmtDate(r.dataPagamento), sortValue: sv((r) => r.dataPagamento) },
    { key: 'formaPagamento', label: 'Forma', render: (r) => <Badge>{r.formaPagamento}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge>{r.status === 0 ? 'CANCELADO' : 'CONFIRMADO'}</Badge> },
  ],
  chips: [
    { label: 'Todos', filters: {} },
    { label: 'Pix', filters: { formaPagamento: 'PIX' } },
    { label: 'Boleto', filters: { formaPagamento: 'BOLETO' } },
    { label: 'Cartão', filters: { formaPagamento: 'CARTAO' } },
  ],
  searchable: false,
  urlFilters: ['cobrancaId', 'imovelId'],
  selectFilters: [{ param: 'imovelId', label: 'Imóvel', load: loadImovelOptions }],
  fields: [
    { name: 'cobrancaId', label: 'Cobrança', col: 'cobrancas_id (FK)', type: 'select', required: true, mode: 'create', loadOptions: loadCobrancaAbertaOptions, fkNote: 'Só aparecem cobranças pendentes ou vencidas. A cobrança de um pagamento não muda depois.' },
    { name: 'valorPago', label: 'Valor pago', col: 'pagamento_valor_pago', type: 'money', required: true, half: true, placeholder: '850,00' },
    { name: 'dataPagamento', label: 'Data do pagamento', col: 'pagamento_data_pagamento', type: 'date', required: true, half: true },
    { name: 'formaPagamento', label: 'Forma de pagamento', col: 'pagamento_forma_pagamento', type: 'radio', options: radio(FORMAS) },
    { name: 'observacao', label: 'Observação', col: 'pagamento_observacao', type: 'textarea', placeholder: 'Observações adicionais (opcional)' },
    status('status', 'Pagamento confirmado', 'Desmarque para cancelar: a cobrança volta a ficar em aberto se deixar de ser coberta'),
  ],
  formSubtitle: '',
  defaults: { cobrancaId: '', valorPago: '', dataPagamento: '', formaPagamento: 'PIX', observacao: '', status: 1 },
  toForm: (r) => ({
    valorPago: r.valorPago,
    dataPagamento: toDateInput(r.dataPagamento),
    formaPagamento: r.formaPagamento,
    observacao: r.observacao ?? '',
    status: r.status,
  }),
  toPayload: (v, mode) => ({
    ...(mode === 'create' ? { cobrancaId: Number(v.cobrancaId) } : {}),
    valorPago: v.valorPago,
    // meio-dia em UTC: o dia escolhido não muda de lado em nenhum fuso do Brasil
    dataPagamento: `${v.dataPagamento}T12:00:00.000Z`,
    formaPagamento: v.formaPagamento,
    // vazio ao criar: não envia; ao editar: envia para limpar
    ...(v.observacao || mode === 'edit' ? { observacao: v.observacao ?? '' } : {}),
    status: v.status,
  }),
  newLabel: 'Registrar pagamento',
  rowTitle: (r) => `Pagamento · ${r._imovel ?? ''}`,
  idLabel: (r) => `Código ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.status,
  inactivate: { label: 'Cancelar pagamento', confirm: 'O pagamento será cancelado e a cobrança será reavaliada.' },
};
