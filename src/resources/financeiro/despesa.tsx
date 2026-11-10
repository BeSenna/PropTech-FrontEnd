import { fmtDate, fmtMoney, toDateInput } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { despesaApi } from '@/services/financeiroService';
import { idFmt, ativoTxt, sv } from '../moradores/shared';
import { status } from '../simulados/shared';

// ---------------------------------------------------------------- Despesas (MS Financeiro, API real)
export const despesaCfg: ResourceConfig = {
  key: 'despesa',
  path: '/despesas',
  singular: 'despesa',
  plural: 'Despesas',
  gender: 'f',
  endpoint: 'GET /despesas',
  idKey: 'id',
  adapter: despesaApi,
  columns: [
    { key: 'descricao', label: 'Descrição', strong: true, sortValue: sv((r) => r.descricao ?? '') },
    { key: 'fornecedor', label: 'Fornecedor', sortValue: sv((r) => r.fornecedor ?? '') },
    { key: 'valor', label: 'Valor', render: (r) => fmtMoney(r.valor), sortValue: sv((r) => Number(r.valor)) },
    { key: 'data', label: 'Data', render: (r) => fmtDate(r.data), sortValue: sv((r) => r.data) },
    { key: 'categoria', label: 'Categoria', sortValue: sv((r) => r.categoria ?? '') },
    { key: 'status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.status)}</Badge> },
  ],
  chips: [{ label: 'Todas', filters: {} }, { label: 'Manutenção', filters: { categoria: 'Manutenção' } }, { label: 'Limpeza', filters: { categoria: 'Limpeza' } }, { label: 'Segurança', filters: { categoria: 'Segurança' } }],
  searchable: true,
  searchPlaceholder: 'Buscar por descrição ou fornecedor...',
  fields: [
    { name: 'descricao', label: 'Descrição', col: 'despesa_descricao', type: 'text', required: true, maxLength: 255, placeholder: 'Ex.: Manutenção do elevador social' },
    { name: 'fornecedor', label: 'Fornecedor', col: 'despesa_fornecedor', type: 'text', required: true, maxLength: 150, placeholder: 'Nome do fornecedor/prestador' },
    { name: 'valor', label: 'Valor', col: 'despesa_valor', type: 'money', required: true, half: true, placeholder: '0,00' },
    { name: 'data', label: 'Data', col: 'despesa_data_despesa', type: 'date', required: true, half: true },
    { name: 'categoria', label: 'Categoria', col: 'despesa_categoria', type: 'text', required: true, maxLength: 100, placeholder: 'Ex.: Manutenção, Limpeza, Segurança' },
    status('status', 'Despesa ativa', 'Inativas não entram nos totais do painel'),
  ],
  formSubtitle: '',
  defaults: { descricao: '', fornecedor: '', valor: '', data: '', categoria: '', status: 1 },
  toForm: (r) => ({ descricao: r.descricao ?? '', fornecedor: r.fornecedor ?? '', valor: r.valor, data: toDateInput(r.data), categoria: r.categoria ?? '', status: r.status }),
  toPayload: (v) => ({ descricao: v.descricao, fornecedor: v.fornecedor, valor: v.valor, data: v.data, categoria: v.categoria, status: v.status }),
  rowTitle: (r) => r.descricao,
  idLabel: (r) => `Código ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.status,
  inactivate: { label: 'Desativar', confirm: 'A despesa deixará de entrar nos totais do painel.' },
};
