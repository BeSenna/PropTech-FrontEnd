import { fmtDate, fmtDateTime } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { loadMoradorOptions } from '@/services/moradorService';
import { manutencaoStore, ocorrenciaStore } from '@/mock/data';
import { idFmt, ativoTxt, vazio, agora, radio, status } from './shared';

// ---------------------------------------------------------------- Ocorrências
export const ocorrenciaCfg: ResourceConfig = {
  key: 'ocorrencia',
  path: '/ocorrencias',
  singular: 'ocorrência',
  plural: 'Ocorrências',
  gender: 'f',
  endpoint: 'GET /ocorrencia',
  idKey: 'id',
  adapter: ocorrenciaStore,
  columns: [
    { key: 'ocorrencia_titulo', label: 'Título', strong: true },
    { key: 'morador_nome', label: 'Morador' },
    { key: 'ocorrencia_data_ocorrencia', label: 'Data', render: (r) => fmtDate(r.ocorrencia_data_ocorrencia), sortValue: (r) => r.ocorrencia_data_ocorrencia },
    { key: 'ocorrencia_tipo', label: 'Tipo', render: (r) => <Badge>{r.ocorrencia_tipo}</Badge> },
    { key: 'ocorrencia_status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.ocorrencia_status)}</Badge> },
  ],
  chips: [{ label: 'Todas', filters: {} }, { label: 'Aberta', filters: { ocorrencia_tipo: 'ABERTA' } }, { label: 'Em andamento', filters: { ocorrencia_tipo: 'EM_ANDAMENTO' } }, { label: 'Finalizada', filters: { ocorrencia_tipo: 'FINALIZADA' } }],
  searchable: true,
  searchPlaceholder: 'Buscar por título...',
  fields: [
    { name: 'ocorrencia_morador_id', label: 'Morador', col: 'ocorrencia_morador_id (FK)', type: 'select', required: true, loadOptions: loadMoradorOptions },
    { name: 'ocorrencia_titulo', label: 'Título', col: 'ocorrencia_titulo', type: 'text', required: true, placeholder: 'Ex.: Vazamento no teto da garagem' },
    { name: 'ocorrencia_descricao', label: 'Descrição', col: 'ocorrencia_descricao', type: 'textarea', required: true, placeholder: 'Descreva com detalhes o que está acontecendo' },
    { name: 'ocorrencia_tipo', label: 'Tipo', col: 'ocorrencia_tipo', type: 'radio', options: radio(['ABERTA', 'EM_ANDAMENTO', 'FINALIZADA']) },
    status('ocorrencia_status', 'Ocorrência ativa', 'Inativas saem do painel de acompanhamento'),
  ],
  formSubtitle: '',
  defaults: { ocorrencia_morador_id: '', ocorrencia_titulo: '', ocorrencia_descricao: '', ocorrencia_tipo: 'ABERTA', ocorrencia_status: 1 },
  toForm: (r) => ({ ...r }),
  toPayload: (v, mode) => ({
    ...v,
    ...(v.ocorrencia_morador_id__label ? { morador_nome: v.ocorrencia_morador_id__label } : {}),
    ...(mode === 'create' ? { ocorrencia_data_ocorrencia: agora() } : {}),
  }),
  rowTitle: (r) => r.ocorrencia_titulo,
  idLabel: (r) => `Código ${idFmt(r.id)}`,
  hasDetail: true,
  hero: { kind: 'OCORRÊNCIA', color: 'amber', badges: (r) => [r.ocorrencia_tipo], sub: (r) => `Reportada por ${r.morador_nome}` },
  detailTitle: 'Dados da ocorrência',
  detailRows: (r) => [
    ['ocorrencia_morador_id', r.morador_nome],
    ['ocorrencia_titulo', r.ocorrencia_titulo],
    ['ocorrencia_descricao', vazio(r.ocorrencia_descricao)],
    ['ocorrencia_data_ocorrencia', fmtDateTime(r.ocorrencia_data_ocorrencia)],
    ['ocorrencia_tipo', r.ocorrencia_tipo],
    ['ocorrencia_status', r.ocorrencia_status === 1 ? 'Ativo' : 'Inativo'],
  ],
  related: (r) => ({
    title: 'Manutenções vinculadas',
    items: manutencaoStore
      .all()
      .filter((m) => m.ocorrencia_id === r.id)
      .map((m) => ({ icon: '🔧', title: m.manutencao_descricao, sub: `${m.manutencao_tipo} · ${m.manutencao_responsavel}`, to: `/manutencoes/${m.id}/editar` })),
  }),
  detailActions: (r) => [{ label: '+ Registrar manutenção', to: `/manutencoes/novo?ocorrencia_id=${r.id}`, primary: true }],
  statusOf: (r) => r.ocorrencia_status,
  inactivate: { label: 'Desativar', confirm: 'A ocorrência sairá do painel de acompanhamento.' },
  mockTag: true,
};
