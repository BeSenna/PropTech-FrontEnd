import { fmtDate, fmtMoney } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { despesaStore } from '@/mock/data';
import { idFmt, ativoTxt, status } from './shared';

// ---------------------------------------------------------------- Despesas
export const despesaCfg: ResourceConfig = {
  key: 'despesa',
  path: '/despesas',
  singular: 'despesa',
  plural: 'Despesas',
  gender: 'f',
  endpoint: 'GET /despesa',
  idKey: 'id',
  adapter: despesaStore,
  columns: [
    { key: 'despesa_descricao', label: 'Descrição', strong: true },
    { key: 'despesa_fornecedor', label: 'Fornecedor' },
    { key: 'despesa_valor', label: 'Valor', render: (r) => fmtMoney(r.despesa_valor), sortValue: (r) => r.despesa_valor },
    { key: 'despesa_data_despesa', label: 'Data', render: (r) => fmtDate(r.despesa_data_despesa), sortValue: (r) => r.despesa_data_despesa },
    { key: 'despesa_categoria', label: 'Categoria' },
    { key: 'despesa_status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.despesa_status)}</Badge> },
  ],
  chips: [{ label: 'Todas', filters: {} }, ...['Manutenção', 'Limpeza', 'Segurança'].map((c) => ({ label: c, filters: { despesa_categoria: c } }))],
  searchable: true,
  searchPlaceholder: 'Buscar por descrição ou fornecedor...',
  fields: [
    { name: 'despesa_descricao', label: 'Descrição', col: 'despesa_descricao', type: 'text', required: true, placeholder: 'Ex.: Manutenção do elevador social' },
    { name: 'despesa_fornecedor', label: 'Fornecedor', col: 'despesa_fornecedor', type: 'text', required: true, placeholder: 'Nome do fornecedor/prestador' },
    { name: 'despesa_valor', label: 'Valor', col: 'despesa_valor', type: 'money', required: true, half: true, placeholder: '0,00' },
    { name: 'despesa_data_despesa', label: 'Data', col: 'despesa_data_despesa', type: 'date', required: true, half: true },
    { name: 'despesa_categoria', label: 'Categoria', col: 'despesa_categoria', type: 'text', required: true, placeholder: 'Ex.: Manutenção, Limpeza, Segurança' },
    status('despesa_status', 'Despesa ativa', 'Inativas não entram nos totais do dashboard'),
  ],
  formSubtitle: '',
  defaults: { despesa_descricao: '', despesa_fornecedor: '', despesa_valor: '', despesa_data_despesa: '', despesa_categoria: '', despesa_status: 1 },
  toForm: (r) => ({ ...r }),
  toPayload: (v) => ({ ...v }),
  rowTitle: (r) => r.despesa_descricao,
  idLabel: (r) => `Código ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.despesa_status,
  inactivate: { label: 'Desativar', confirm: 'A despesa deixará de entrar nos totais do dashboard.' },
  mockTag: true,
};
