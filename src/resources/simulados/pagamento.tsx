import { competenciaTxt, fmtDate, fmtMoney } from '@/lib/format';
import type { Rec, ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { cobrancaStore, pagamentoStore } from '@/mock/data';
import { idFmt, radio, status, optsDe } from './shared';

// ---------------------------------------------------------------- Pagamentos
const cobrancaLabel = (c: Rec) => `${c.imovel_label} · ${competenciaTxt(c.cobranca_competencia)} · ${fmtMoney(c.cobranca_valor)}`;
export const pagamentoCfg: ResourceConfig = {
  key: 'pagamento',
  path: '/pagamentos',
  singular: 'pagamento',
  plural: 'Pagamentos',
  gender: 'm',
  endpoint: 'GET /pagamento',
  idKey: 'id',
  adapter: pagamentoStore,
  columns: [
    { key: 'competencia_txt', label: 'Cobrança', strong: true },
    { key: 'imovel_label', label: 'Imóvel' },
    { key: 'bloco_nome', label: 'Bloco' },
    { key: 'pagamento_valor_pago', label: 'Valor pago', render: (r) => fmtMoney(r.pagamento_valor_pago), sortValue: (r) => r.pagamento_valor_pago },
    { key: 'pagamento_data_pagamento', label: 'Data', render: (r) => fmtDate(r.pagamento_data_pagamento), sortValue: (r) => r.pagamento_data_pagamento },
    { key: 'pagamento_forma_pagamento', label: 'Forma', render: (r) => <Badge>{r.pagamento_forma_pagamento}</Badge> },
    { key: 'pagamento_status', label: 'Status', render: (r) => <Badge>{r.pagamento_status === 1 ? 'CONFIRMADO' : 'PENDENTE'}</Badge> },
  ],
  chips: [{ label: 'Todos', filters: {} }, { label: 'Pix', filters: { pagamento_forma_pagamento: 'PIX' } }, { label: 'Boleto', filters: { pagamento_forma_pagamento: 'BOLETO' } }, { label: 'Cartão', filters: { pagamento_forma_pagamento: 'CARTAO' } }],
  searchable: true,
  searchPlaceholder: 'Buscar por imóvel ou competência...',
  urlFilters: [],
  fields: [
    { name: 'cobranca_id', label: 'Cobrança', col: 'cobrancas_id (FK)', type: 'select', required: true, loadOptions: optsDe(cobrancaStore, cobrancaLabel) },
    { name: 'pagamento_valor_pago', label: 'Valor pago', col: 'pagamento_valor_pago', type: 'money', required: true, half: true, placeholder: '850,00' },
    { name: 'pagamento_data_pagamento', label: 'Data do pagamento', col: 'pagamento_data_pagamento', type: 'date', required: true, half: true },
    { name: 'pagamento_forma_pagamento', label: 'Forma de pagamento', col: 'pagamento_forma_pagamento', type: 'radio', options: radio(['PIX', 'BOLETO', 'CARTAO']) },
    { name: 'pagamento_observacao', label: 'Observação', col: 'pagamento_observacao', type: 'textarea', placeholder: 'Observações adicionais (opcional)' },
    status('pagamento_status', 'Pagamento confirmado', 'Desmarque se estiver aguardando compensação'),
  ],
  formSubtitle: '',
  defaults: { cobranca_id: '', pagamento_valor_pago: '', pagamento_data_pagamento: '', pagamento_forma_pagamento: 'PIX', pagamento_observacao: '', pagamento_status: 1 },
  toForm: (r) => ({ ...r }),
  toPayload: (v) => {
    const c = cobrancaStore.all().find((x) => x.id === Number(v.cobranca_id));
    return {
      ...v,
      cobranca_id: Number(v.cobranca_id),
      ...(c ? { cobranca_label: cobrancaLabel(c), imovel_label: c.imovel_label, bloco_nome: c.bloco_nome, competencia_txt: competenciaTxt(c.cobranca_competencia) } : {}),
    };
  },
  newLabel: 'Registrar pagamento',
  rowTitle: (r) => `Pagamento · ${r.imovel_label}`,
  idLabel: (r) => `Código ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.pagamento_status,
  inactivate: { label: 'Cancelar pagamento', confirm: 'O pagamento será marcado como não confirmado.' },
  mockTag: true,
};
