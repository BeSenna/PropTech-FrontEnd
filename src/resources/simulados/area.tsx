import { fmtDate } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { areaStore, reservaStore } from '@/mock/data';
import { idFmt, ativoTxt, vazio, horario, status } from './shared';

// ---------------------------------------------------------------- Áreas comuns
export const areaCfg: ResourceConfig = {
  key: 'area',
  path: '/areas-comuns',
  singular: 'área comum',
  plural: 'Áreas Comuns',
  gender: 'f',
  endpoint: 'GET /area_comum',
  idKey: 'id',
  adapter: areaStore,
  columns: [
    { key: 'area_comum_nome', label: 'Nome', strong: true },
    { key: 'area_comum_capacidade', label: 'Capacidade', render: (r) => `${r.area_comum_capacidade} pessoas`, sortValue: (r) => r.area_comum_capacidade },
    { key: 'reservas', label: 'Reservas no mês', render: (r) => reservaStore.all().filter((x) => x.area_comum_id === r.id && x.reserva_status === 1).length },
    { key: 'area_comum_status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.area_comum_status, 'ATIVA', 'INATIVA')}</Badge> },
  ],
  chips: [{ label: 'Todas', filters: {} }, { label: 'Ativas', filters: { area_comum_status: 1 } }, { label: 'Inativas', filters: { area_comum_status: 0 } }],
  searchable: true,
  searchPlaceholder: 'Buscar por nome...',
  fields: [
    { name: 'area_comum_nome', label: 'Nome', col: 'area_comum_nome', type: 'text', required: true },
    { name: 'area_comum_descricao', label: 'Descrição', col: 'area_comum_descricao', type: 'text' },
    { name: 'area_comum_capacidade', label: 'Capacidade', col: 'area_comum_capacidade', type: 'number', required: true, min: 1, half: true, placeholder: '80' },
    status('area_comum_status', 'Área comum ativa', 'Inativas não aceitam novas reservas'),
  ],
  formSubtitle: '',
  defaults: { area_comum_nome: '', area_comum_descricao: '', area_comum_capacidade: '', area_comum_status: 1 },
  toForm: (r) => ({ ...r }),
  toPayload: (v) => ({ ...v }),
  rowTitle: (r) => r.area_comum_nome,
  idLabel: (r) => `Código ${idFmt(r.id)}`,
  hasDetail: true,
  hero: { kind: 'ÁREA COMUM', color: 'green', badges: (r) => [ativoTxt(r.area_comum_status, 'ATIVA', 'INATIVA')], sub: (r) => `Capacidade: ${r.area_comum_capacidade} pessoas` },
  detailTitle: 'Dados da área comum',
  detailRows: (r) => [
    ['area_comum_nome', r.area_comum_nome],
    ['area_comum_descricao', vazio(r.area_comum_descricao)],
    ['area_comum_capacidade', `${r.area_comum_capacidade} pessoas`],
    ['area_comum_status', r.area_comum_status === 1 ? 'Ativa' : 'Inativa'],
  ],
  related: (r) => {
    const rs = reservaStore.all().filter((x) => x.area_comum_id === r.id);
    return {
      title: 'Reservas vinculadas',
      items: rs.slice(0, 5).map((x) => ({ icon: '📅', title: x.morador_nome, sub: `${fmtDate(x.reserva_data_reserva)} · ${horario(x)} · ${x.reserva_tipo}`, to: `/reservas/${x.id}/editar` })),
      footer: { label: 'Ver todas as reservas', to: '/reservas' },
    };
  },
  detailActions: (r) => [{ label: '+ Nova reserva', to: `/reservas/novo?area_comum_id=${r.id}`, primary: true }],
  statusOf: (r) => r.area_comum_status,
  inactivate: { label: 'Desativar', confirm: 'A área ficará inativa e não aceitará novas reservas.' },
  mockTag: true,
};
