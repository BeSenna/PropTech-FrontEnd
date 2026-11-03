import { fmtDate } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { manutencaoStore, ocorrenciaStore } from '@/mock/data';
import { idFmt, ativoTxt, radio, status, optsDe } from './shared';

// ---------------------------------------------------------------- Manutenções
export const manutencaoCfg: ResourceConfig = {
  key: 'manutencao',
  path: '/manutencoes',
  singular: 'manutenção',
  plural: 'Manutenções',
  gender: 'f',
  endpoint: 'GET /manutencao',
  idKey: 'id',
  adapter: manutencaoStore,
  columns: [
    { key: 'ocorrencia_label', label: 'Ocorrência', strong: true },
    { key: 'manutencao_responsavel', label: 'Responsável' },
    { key: 'manutencao_data_solicitacao', label: 'Solicitação', render: (r) => fmtDate(r.manutencao_data_solicitacao), sortValue: (r) => r.manutencao_data_solicitacao },
    { key: 'manutencao_data_conclusao', label: 'Conclusão', render: (r) => fmtDate(r.manutencao_data_conclusao) },
    { key: 'manutencao_tipo', label: 'Tipo', render: (r) => <Badge>{r.manutencao_tipo}</Badge> },
    { key: 'manutencao_status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.manutencao_status)}</Badge> },
  ],
  chips: [{ label: 'Todas', filters: {} }, { label: 'Pendente', filters: { manutencao_tipo: 'PENDENTE' } }, { label: 'Em execução', filters: { manutencao_tipo: 'EM_EXECUCAO' } }, { label: 'Concluída', filters: { manutencao_tipo: 'CONCLUIDA' } }],
  searchable: true,
  searchPlaceholder: 'Buscar por ocorrência ou responsável...',
  fields: [
    { name: 'ocorrencia_id', label: 'Ocorrência', col: 'ocorrencia_id (FK)', type: 'select', required: true, loadOptions: optsDe(ocorrenciaStore, (o) => o.ocorrencia_titulo, 'ocorrencia_status') },
    { name: 'manutencao_descricao', label: 'Descrição', col: 'manutencao_descricao', type: 'text', required: true, placeholder: 'Reparo de impermeabilização da laje' },
    { name: 'manutencao_responsavel', label: 'Responsável', col: 'manutencao_responsavel', type: 'text', required: true },
    { name: 'manutencao_data_solicitacao', label: 'Data solicitação', col: 'manutencao_data_solicitacao', type: 'date', required: true, half: true },
    { name: 'manutencao_data_conclusao', label: 'Data conclusão', col: 'manutencao_data_conclusao', type: 'date', half: true },
    { name: 'manutencao_tipo', label: 'Tipo', col: 'manutencao_tipo', type: 'radio', options: radio(['PENDENTE', 'EM_EXECUCAO', 'CONCLUIDA']) },
    status('manutencao_status', 'Manutenção ativa', 'Inativas saem do painel de acompanhamento'),
  ],
  formSubtitle: '',
  defaults: { ocorrencia_id: '', manutencao_descricao: '', manutencao_responsavel: '', manutencao_data_solicitacao: '', manutencao_data_conclusao: '', manutencao_tipo: 'PENDENTE', manutencao_status: 1 },
  urlFilters: [],
  toForm: (r) => ({ ...r }),
  toPayload: (v) => ({ ...v, ocorrencia_id: Number(v.ocorrencia_id), ...(v.ocorrencia_id__label ? { ocorrencia_label: v.ocorrencia_id__label } : {}) }),
  newLabel: 'Registrar manutenção',
  rowTitle: (r) => r.manutencao_descricao,
  idLabel: (r) => `Código ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.manutencao_status,
  inactivate: { label: 'Desativar', confirm: 'A manutenção sairá do painel de acompanhamento.' },
  mockTag: true,
};
