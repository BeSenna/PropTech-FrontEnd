import { fmtDateTime } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { avisoStore } from '@/mock/data';
import { idFmt, ativoTxt, agora, status } from './shared';

// ---------------------------------------------------------------- Avisos
export const avisoCfg: ResourceConfig = {
  key: 'aviso',
  path: '/avisos',
  singular: 'aviso',
  plural: 'Avisos',
  gender: 'm',
  endpoint: 'GET /avisos',
  idKey: 'id',
  adapter: avisoStore,
  columns: [
    { key: 'avisos_titulo', label: 'Título', strong: true },
    { key: 'avisos_data_publicacao', label: 'Publicação', render: (r) => fmtDateTime(r.avisos_data_publicacao), sortValue: (r) => r.avisos_data_publicacao },
    { key: 'avisos_data_expiracao', label: 'Expiração', render: (r) => fmtDateTime(r.avisos_data_expiracao) },
    { key: 'avisos_status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.avisos_status)}</Badge> },
  ],
  chips: [{ label: 'Todos', filters: {} }, { label: 'Ativos', filters: { avisos_status: 1 } }, { label: 'Expirados', filters: { avisos_status: 0 } }],
  searchable: true,
  searchPlaceholder: 'Buscar por título...',
  listSub: '👥 Também visível para moradores',
  fields: [
    { name: 'avisos_titulo', label: 'Título', col: 'avisos_titulo', type: 'text', required: true, placeholder: 'Ex.: Manutenção programada do elevador' },
    { name: 'avisos_mensagem', label: 'Mensagem', col: 'avisos_mensagem', type: 'textarea', required: true, placeholder: 'Texto completo do aviso' },
    { name: 'avisos_data_expiracao', label: 'Data de expiração', col: 'avisos_data_expiracao', type: 'date', placeholder: 'opcional' },
    status('avisos_status', 'Aviso ativo', 'Inativos não aparecem no mural'),
  ],
  formSubtitle: 'A data de publicação é preenchida automaticamente.',
  defaults: { avisos_titulo: '', avisos_mensagem: '', avisos_data_expiracao: '', avisos_status: 1 },
  toForm: (r) => ({ ...r, avisos_data_expiracao: String(r.avisos_data_expiracao ?? '').slice(0, 10) }),
  toPayload: (v, mode) => ({ ...v, ...(mode === 'create' ? { avisos_data_publicacao: agora() } : {}) }),
  rowTitle: (r) => r.avisos_titulo,
  idLabel: (r) => `Código ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.avisos_status,
  inactivate: { label: 'Desativar', confirm: 'O aviso deixará de aparecer no mural.' },
  mockTag: true,
};
