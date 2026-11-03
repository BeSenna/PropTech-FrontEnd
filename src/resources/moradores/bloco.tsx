import { andarTxt } from '@/lib/format';
import type { Rec, ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { blocoApi } from '@/services/moradorService';
import { idFmt, ativoTxt, vazio, sv } from './shared';

// ---------------------------------------------------------------- Blocos
export const blocoCfg: ResourceConfig = {
  key: 'bloco',
  path: '/blocos',
  singular: 'bloco',
  plural: 'Blocos',
  gender: 'm',
  endpoint: 'GET /bloco',
  idKey: 'blocoId',
  adapter: blocoApi,
  columns: [
    { key: 'blocoNome', label: 'Bloco', strong: true, sortValue: sv((r) => r.blocoNome) },
    { key: 'blocoDescricao', label: 'Descrição', render: (r) => vazio(r.blocoDescricao), sortValue: sv((r) => r.blocoDescricao ?? '') },
    { key: 'imoveis', label: 'Imóveis', render: (r) => r._count?.imoveis ?? 0, sortValue: sv((r) => r._count?.imoveis ?? 0) },
    { key: 'blocoStatus', label: 'Status', render: (r) => <Badge>{ativoTxt(r.blocoStatus)}</Badge>, sortValue: sv((r) => r.blocoStatus) },
  ],
  chips: [
    { label: 'Todos', filters: {} },
    { label: 'Ativos', filters: { status: 1 } },
    { label: 'Inativos', filters: { status: 0 } },
  ],
  searchable: true,
  searchPlaceholder: 'Buscar por nome do bloco...',
  fields: [
    { name: 'blocoNome', label: 'Nome do bloco', col: 'bloco_nome', type: 'text', required: true, maxLength: 50, placeholder: 'Ex.: Bloco A' },
    { name: 'blocoDescricao', label: 'Descrição', col: 'bloco_descricao', type: 'text', maxLength: 255, placeholder: 'Ex.: Torre frontal, 6 pavimentos' },
    { name: 'blocoStatus', label: 'Status', col: 'bloco_status', type: 'toggle', toggleTitle: 'Bloco ativo', toggleHint: 'Inativos não recebem novos imóveis' },
  ],
  formSubtitle: '',
  defaults: { blocoNome: '', blocoDescricao: '', blocoStatus: 1 },
  toForm: (r) => ({ blocoNome: r.blocoNome, blocoDescricao: r.blocoDescricao ?? '', blocoStatus: r.blocoStatus }),
  toPayload: (v, mode) => ({
    blocoNome: v.blocoNome,
    ...(v.blocoDescricao ? { blocoDescricao: v.blocoDescricao } : mode === 'edit' ? { blocoDescricao: null } : {}),
    blocoStatus: v.blocoStatus,
  }),
  rowTitle: (r) => r.blocoNome,
  idLabel: (r) => `Código ${idFmt(r.blocoId)}`,
  hasDetail: true,
  hero: {
    kind: 'BLOCO',
    color: 'navy',
    badges: (r) => [ativoTxt(r.blocoStatus)],
    sub: (r) => `${r.imoveis?.length ?? r._count?.imoveis ?? 0} imóveis`,
  },
  detailTitle: 'Dados do bloco',
  detailRows: (r) => [
    ['bloco_nome', r.blocoNome],
    ['bloco_descricao', vazio(r.blocoDescricao)],
    ['bloco_status', r.blocoStatus === 1 ? 'Ativo' : 'Inativo'],
    ['Código', idFmt(r.blocoId)],
  ],
  related: (r) => ({
    title: 'Imóveis do bloco',
    items: (r.imoveis ?? []).slice(0, 8).map((i: Rec) => ({
      icon: '🏠',
      title: `${i.imovelTipo === 'COBERTURA' ? 'Cob.' : 'Apto'} ${i.imovelNumero}`,
      sub: `${i.imovelTipo}${andarTxt(i.imovelAndar)}`,
      to: `/imoveis/${i.imovelId}`,
    })),
    footer: { label: 'Ver todos os imóveis', to: `/imoveis?blocoId=${r.blocoId}` },
  }),
  statusOf: (r) => r.blocoStatus,
  inactivate: { label: 'Desativar', confirm: 'O bloco ficará inativo e não receberá novos imóveis. O histórico é mantido.' },
};
