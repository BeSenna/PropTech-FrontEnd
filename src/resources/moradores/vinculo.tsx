import { fmtDate, toDateInput } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { EncerrarButton } from '@/components/EncerrarButton';
import { blocoLetra, criarUsuario, getBlocoMap, imovelRotulo, limparCache, loadImovelOptions, loadMoradorOptions, vinculoApi } from '@/services/moradorService';
import { idFmt, sv, quem } from './shared';

// ---------------------------------------------------------------- Vínculos (morador_imovel)
export const vinculoCfg: ResourceConfig = {
  key: 'vinculo',
  path: '/vinculos',
  singular: 'relação',
  plural: 'Relação',
  gender: 'f',
  endpoint: 'GET /morador-imovel',
  idKey: 'moradorImovelId',
  adapter: vinculoApi,
  columns: [
    { key: 'morador', label: 'Morador', render: (r) => quem(r.morador?.moradorNome ?? `#${r.moradorId}`), sortValue: sv((r) => r.morador?.moradorNome ?? '') },
    { key: 'imovel', label: 'Imóvel', render: (r) => `Apto ${r.imovel?.imovelNumero ?? r.imovelId}` },
    { key: 'bloco', label: 'Bloco', render: (r) => blocoLetra(r._bloco) },
    { key: 'tipo', label: 'Tipo de relação', render: (r) => <Badge>{r.moradorImovelTipoRelacao}</Badge>, sortValue: sv((r) => r.moradorImovelTipoRelacao) },
    { key: 'inicio', label: 'Início', render: (r) => fmtDate(r.moradorImovelDataInicio), sortValue: sv((r) => r.moradorImovelDataInicio) },
    { key: 'fim', label: 'Fim', render: (r) => fmtDate(r.moradorImovelDataFim) },
    { key: 'estado', label: 'Status', render: (r) => <Badge>{r.moradorImovelStatus === 1 ? r.estado : 'INATIVO'}</Badge> },
    { key: 'acesso', label: 'Acesso', render: (r) => (r.usuarioId ? <Badge>COM LOGIN</Badge> : '—') },
  ],
  enrich: async (rows) => {
    const b = await getBlocoMap();
    return rows.map((r) => ({ ...r, _bloco: b[r.imovel?.blocoId] }));
  },
  chips: [
    { label: 'Todos', filters: {} },
    { label: 'Proprietário', filters: { tipoRelacao: 'PROPRIETARIO' } },
    { label: 'Inquilino', filters: { tipoRelacao: 'INQUILINO' } },
    { label: 'Morador', filters: { tipoRelacao: 'MORADOR' } },
    { label: 'Temporada', filters: { tipoRelacao: 'TEMPORADA' } },
  ],
  searchable: false,
  urlFilters: ['moradorId', 'imovelId'],
  fields: [
    { name: 'moradorId', label: 'Morador', col: 'morador_id (FK)', type: 'select', required: true, loadOptions: loadMoradorOptions },
    { name: 'imovelId', label: 'Imóvel', col: 'imovel_id (FK)', type: 'select', required: true, loadOptions: loadImovelOptions },
    {
      name: 'moradorImovelTipoRelacao',
      label: 'Tipo de relação',
      col: 'morador_imovel_tipo_relacao',
      type: 'radio',
      required: true,
      options: ['PROPRIETARIO', 'INQUILINO', 'MORADOR', 'TEMPORADA'].map((x) => ({ value: x, label: x })),
    },
    { name: 'moradorImovelDataInicio', label: 'Início', col: 'morador_imovel_data_inicio', type: 'date', required: true, half: true },
    { name: 'moradorImovelDataFim', label: 'Fim (opcional)', col: 'morador_imovel_data_fim', type: 'date', half: true },
    { name: 'moradorImovelStatus', label: 'Status', col: 'morador_imovel_status', type: 'toggle', toggleTitle: 'Vínculo ativo', toggleHint: 'Desative ao invés de excluir para manter histórico' },
  ],
  formSubtitle: '',
  defaults: { moradorId: '', imovelId: '', moradorImovelTipoRelacao: 'MORADOR', moradorImovelDataInicio: '', moradorImovelDataFim: '', moradorImovelStatus: 1, _acesso: false, _login: '', _senha: '' },
  extraFormSection: 'vinculoAcesso',
  toForm: (r) => ({
    moradorId: r.moradorId,
    imovelId: r.imovelId,
    moradorImovelTipoRelacao: r.moradorImovelTipoRelacao,
    moradorImovelDataInicio: toDateInput(r.moradorImovelDataInicio),
    moradorImovelDataFim: toDateInput(r.moradorImovelDataFim),
    moradorImovelStatus: r.moradorImovelStatus,
    _usuarioId: r.usuarioId,
  }),
  toPayload: (v, mode) => ({
    moradorId: v.moradorId,
    imovelId: v.imovelId,
    moradorImovelTipoRelacao: v.moradorImovelTipoRelacao,
    moradorImovelDataInicio: v.moradorImovelDataInicio,
    moradorImovelStatus: v.moradorImovelStatus,
    // ao editar, campo vazio envia null para o back limpar a data de fim
    ...(v.moradorImovelDataFim ? { moradorImovelDataFim: v.moradorImovelDataFim } : mode === 'edit' ? { moradorImovelDataFim: null } : {}),
  }),
  afterSave: async (saved, v, mode) => {
    // Conceder acesso = criar o usuário já ligado a esta relação (POST /usuario com moradorImovelId)
    if (mode === 'create' && v._acesso) {
      await criarUsuario({ usuarioLogin: String(v._login).trim(), senha: v._senha, usuarioPerfil: 'MORADOR', moradorImovelId: saved.moradorImovelId });
      limparCache();
    }
  },
  rowTitle: (r) => `${r.morador?.moradorNome ?? 'Morador'} · ${r.imovel ? imovelRotulo(r.imovel, r.imovel.bloco?.blocoNome) : `Imóvel #${r.imovelId}`}`,
  idLabel: (r) => `Código ${idFmt(r.moradorImovelId)}`,
  hasDetail: true,
  hero: {
    kind: 'RELAÇÃO',
    color: 'pink',
    badges: (r) => [r.moradorImovelTipoRelacao, r.moradorImovelStatus === 1 ? r.estado : 'INATIVO'],
  },
  detailTitle: 'Dados da relação',
  detailRows: (r) => [
    ['morador', r.morador?.moradorNome ?? `#${r.moradorId}`],
    ['imovel', r.imovel ? imovelRotulo(r.imovel, r.imovel.bloco?.blocoNome) : `#${r.imovelId}`],
    ['morador_imovel_tipo_relacao', r.moradorImovelTipoRelacao],
    ['morador_imovel_data_inicio', fmtDate(r.moradorImovelDataInicio)],
    ['morador_imovel_data_fim', fmtDate(r.moradorImovelDataFim)],
    ['estado (derivado)', r.estado],
    ['morador_imovel_status', r.moradorImovelStatus === 1 ? 'Ativo' : 'Inativo'],
    ['usuario_id', r.usuarioId ? idFmt(r.usuarioId) : '— (sem acesso ao portal)'],
  ],
  related: (r) => ({
    title: 'Navegação',
    items: [
      { icon: '🧍', title: r.morador?.moradorNome ?? 'Morador', sub: 'Abrir perfil do morador', to: `/moradores/${r.moradorId}` },
      { icon: '🏠', title: r.imovel ? imovelRotulo(r.imovel, r.imovel.bloco?.blocoNome) : 'Imóvel', sub: 'Abrir imóvel', to: `/imoveis/${r.imovelId}` },
    ],
  }),
  extraDetail: (r, reload) => <EncerrarButton row={r} reload={reload} />,
  statusOf: (r) => r.moradorImovelStatus,
  inactivate: { label: 'Desativar', confirm: 'A relação ficará inativa, mas o histórico é mantido.' },
};
