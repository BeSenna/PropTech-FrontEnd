import { fmtDate, fmtMoney, toDateInput } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { receitaApi } from '@/services/financeiroService';
import { idFmt, ativoTxt, sv } from '../moradores/shared';
import { status } from '../simulados/shared';

// ---------------------------------------------------------------- Receitas (MS Financeiro, API real)
export const receitaCfg: ResourceConfig = {
  key: 'receita',
  path: '/receitas',
  singular: 'receita',
  plural: 'Receitas',
  gender: 'f',
  endpoint: 'GET /receitas',
  idKey: 'id',
  adapter: receitaApi,
  columns: [
    { key: 'descricao', label: 'Descrição', strong: true, sortValue: sv((r) => r.descricao ?? '') },
    { key: 'valor', label: 'Valor', render: (r) => fmtMoney(r.valor), sortValue: sv((r) => Number(r.valor)) },
    { key: 'data', label: 'Data', render: (r) => fmtDate(r.data), sortValue: sv((r) => r.data) },
    { key: 'categoria', label: 'Categoria', sortValue: sv((r) => r.categoria ?? '') },
    { key: 'status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.status)}</Badge> },
  ],
  chips: [{ label: 'Todas', filters: {} }, { label: 'Aluguel de área', filters: { categoria: 'Aluguel de área' } }, { label: 'Multas', filters: { categoria: 'Multas' } }],
  searchable: true,
  searchPlaceholder: 'Buscar por descrição...',
  fields: [
    { name: 'descricao', label: 'Descrição', col: 'receita_descricao', type: 'text', required: true, maxLength: 255, placeholder: 'Ex.: Aluguel do salão de festas — setembro' },
    { name: 'valor', label: 'Valor', col: 'receita_valor', type: 'money', required: true, half: true, placeholder: '0,00' },
    { name: 'data', label: 'Data', col: 'receita_data_receita', type: 'date', required: true, half: true },
    { name: 'categoria', label: 'Categoria', col: 'receita_categoria', type: 'text', required: true, maxLength: 100, placeholder: 'Ex.: Aluguel de área, Multas' },
    status('status', 'Receita ativa', 'Inativas não entram nos totais do painel'),
  ],
  formSubtitle: '',
  defaults: { descricao: '', valor: '', data: '', categoria: '', status: 1 },
  toForm: (r) => ({ descricao: r.descricao ?? '', valor: r.valor, data: toDateInput(r.data), categoria: r.categoria ?? '', status: r.status }),
  toPayload: (v) => ({ descricao: v.descricao, valor: v.valor, data: v.data, categoria: v.categoria, status: v.status }),
  rowTitle: (r) => r.descricao,
  idLabel: (r) => `Código ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.status,
  inactivate: { label: 'Desativar', confirm: 'A receita deixará de entrar nos totais do painel.' },
};
