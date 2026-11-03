import { fmtDate } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { loadMoradorOptions } from '@/services/moradorService';
import { areaStore, reservaStore } from '@/mock/data';
import { idFmt, ativoTxt, radio, horario, status, optsDe } from './shared';

// ---------------------------------------------------------------- Reservas
export const reservaCfg: ResourceConfig = {
  key: 'reserva',
  path: '/reservas',
  singular: 'reserva',
  plural: 'Reservas',
  gender: 'f',
  endpoint: 'GET /reserva',
  idKey: 'id',
  adapter: reservaStore,
  columns: [
    { key: 'area_comum_label', label: 'Área comum', strong: true },
    { key: 'morador_nome', label: 'Morador' },
    { key: 'reserva_data_reserva', label: 'Data', render: (r) => fmtDate(r.reserva_data_reserva), sortValue: (r) => r.reserva_data_reserva },
    { key: 'horario', label: 'Horário', render: horario },
    { key: 'reserva_tipo', label: 'Tipo', render: (r) => <Badge>{r.reserva_tipo}</Badge> },
    { key: 'reserva_status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.reserva_status)}</Badge> },
  ],
  chips: [{ label: 'Todas', filters: {} }, ...['PENDENTE', 'CONFIRMADA', 'CANCELADA'].map((t) => ({ label: t[0] + t.slice(1).toLowerCase(), filters: { reserva_tipo: t } }))],
  searchable: true,
  searchPlaceholder: 'Buscar por área ou morador...',
  urlFilters: ['area_comum_id'],
  fields: [
    { name: 'area_comum_id', label: 'Área comum', col: 'area_comum_id (FK)', type: 'select', required: true, loadOptions: optsDe(areaStore, (a) => a.area_comum_nome, 'area_comum_status') },
    { name: 'reserva_morador_id', label: 'Morador', col: 'reserva_morador_id (FK)', type: 'select', required: true, loadOptions: loadMoradorOptions },
    { name: 'reserva_data_reserva', label: 'Data da reserva', col: 'reserva_data_reserva', type: 'date', required: true },
    { name: 'reserva_horario_inicio', label: 'Horário início', col: 'reserva_horario_inicio', type: 'time', required: true, half: true },
    { name: 'reserva_horario_fim', label: 'Horário fim', col: 'reserva_horario_fim', type: 'time', required: true, half: true },
    { name: 'reserva_tipo', label: 'Tipo', col: 'reserva_tipo', type: 'radio', options: radio(['PENDENTE', 'CONFIRMADA', 'CANCELADA']) },
    status('reserva_status', 'Reserva ativa', 'Inativas não bloqueiam o horário'),
  ],
  formSubtitle: '',
  defaults: { area_comum_id: '', reserva_morador_id: '', reserva_data_reserva: '', reserva_horario_inicio: '', reserva_horario_fim: '', reserva_tipo: 'PENDENTE', reserva_status: 1 },
  toForm: (r) => ({ ...r }),
  toPayload: (v) => ({
    ...v,
    area_comum_id: Number(v.area_comum_id),
    ...(v.area_comum_id__label ? { area_comum_label: v.area_comum_id__label } : {}),
    ...(v.reserva_morador_id__label ? { morador_nome: v.reserva_morador_id__label } : {}),
  }),
  rowTitle: (r) => `${r.area_comum_label} · ${fmtDate(r.reserva_data_reserva)}`,
  idLabel: (r) => `Código ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.reserva_status,
  inactivate: { label: 'Cancelar reserva', confirm: 'A reserva ficará inativa e liberará o horário.' },
  mockTag: true,
};
