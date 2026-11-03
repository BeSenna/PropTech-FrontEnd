import { fmtDate, fmtMoney } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { receitaStore } from '@/mock/data';
import { idFmt, ativoTxt, status } from './shared';

// ---------------------------------------------------------------- Receitas
export const receitaCfg: ResourceConfig = {
  key: 'receita',
  path: '/receitas',
  singular: 'receita',
  plural: 'Receitas',
  gender: 'f',
  endpoint: 'GET /receita',
  idKey: 'id',
  adapter: receitaStore,
  columns: [
    { key: 'receita_descricao', label: 'Descrição', strong: true },
    { key: 'receita_valor', label: 'Valor', render: (r) => fmtMoney(r.receita_valor), sortValue: (r) => r.receita_valor },
    { key: 'receita_data_receita', label: 'Data', render: (r) => fmtDate(r.receita_data_receita), sortValue: (r) => r.receita_data_receita },
    { key: 'receita_categoria', label: 'Categoria' },
    { key: 'receita_status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.receita_status)}</Badge> },
  ],
  chips: [{ label: 'Todas', filters: {} }, { label: 'Aluguel de área', filters: { receita_categoria: 'Aluguel de área' } }, { label: 'Multas', filters: { receita_categoria: 'Multas' } }],
  searchable: true,
  searchPlaceholder: 'Buscar por descrição...',
  fields: [
    { name: 'receita_descricao', label: 'Descrição', col: 'receita_descricao', type: 'text', required: true, placeholder: 'Ex.: Aluguel do salão de festas — setembro' },
    { name: 'receita_valor', label: 'Valor', col: 'receita_valor', type: 'money', required: true, half: true, placeholder: '0,00' },
    { name: 'receita_data_receita', label: 'Data', col: 'receita_data_receita', type: 'date', required: true, half: true },
    { name: 'receita_categoria', label: 'Categoria', col: 'receita_categoria', type: 'text', required: true, placeholder: 'Ex.: Aluguel de área, Multas' },
    status('receita_status', 'Receita ativa', 'Inativas não entram nos totais do dashboard'),
  ],
  formSubtitle: '',
  defaults: { receita_descricao: '', receita_valor: '', receita_data_receita: '', receita_categoria: '', receita_status: 1 },
  toForm: (r) => ({ ...r }),
  toPayload: (v) => ({ ...v }),
  rowTitle: (r) => r.receita_descricao,
  idLabel: (r) => `Código ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.receita_status,
  inactivate: { label: 'Desativar', confirm: 'A receita deixará de entrar nos totais do dashboard.' },
  mockTag: true,
};
