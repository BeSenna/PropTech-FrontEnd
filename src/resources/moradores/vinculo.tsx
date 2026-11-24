import { fmtDate, toDateInput, validarDataBr } from '@/lib/format';
import { t } from '@/i18n';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { EncerrarButton } from '@/components/EncerrarButton';
import { blocoLetra, criarUsuario, getBlocoMap, imovelRotulo, limparCache, loadImovelOptions, loadMoradorOptions, vinculoApi } from '@/services/moradorService';
import { motivoOpcaoBloqueada, OPCOES_RELACAO, rotuloOpcao, rotuloTipo, tiposDaOpcao, TIPOS_RELACAO, vigente } from '@/lib/relacao';
import type { Rec } from '@/models/types';
import { idFmt, sv, quem } from './shared';

// Corpo do POST /morador-imovel para um tipo (as datas e o status valem para todas as relações criadas juntas).
const corpoCriacao = (v: Rec, tipo: string): Rec => ({
  moradorId: v.moradorId,
  imovelId: v.imovelId,
  moradorImovelTipoRelacao: tipo,
  moradorImovelDataInicio: v.moradorImovelDataInicio,
  moradorImovelStatus: v.moradorImovelStatus,
  ...(v.moradorImovelDataFim ? { moradorImovelDataFim: v.moradorImovelDataFim } : {}),
});

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
    { key: 'imovel', label: 'Imóvel', render: (r) => `${t('Apto')} ${r.imovel?.imovelNumero ?? r.imovelId}` },
    { key: 'bloco', label: 'Bloco', render: (r) => blocoLetra(r._bloco) },
    { key: 'tipo', label: 'Tipo de relação', render: (r) => <Badge>{r.moradorImovelTipoRelacao}</Badge>, sortValue: sv((r) => r.moradorImovelTipoRelacao) },
    { key: 'inicio', label: 'Início', render: (r) => fmtDate(r.moradorImovelDataInicio), sortValue: sv((r) => r.moradorImovelDataInicio) },
    { key: 'fim', label: 'Fim', render: (r) => fmtDate(r.moradorImovelDataFim) },
    { key: 'estado', label: 'Status', render: (r) => <Badge>{r.moradorImovelStatus === 1 ? r.estado : 'INATIVO'}</Badge> },
    { key: 'acesso', label: 'Acesso', render: (r) => (r.usuarioId ? <Badge>COM LOGIN</Badge> : '—') },
  ],
  enrich: async (rows) => {
    const b = await getBlocoMap();
    // _combo: a pessoa é Proprietário E Morador, ao mesmo tempo, deste imóvel (as duas relações em vigor)
    const par = new Set(
      rows
        .filter((r) => vigente(r) && r.moradorImovelTipoRelacao === 'PROPRIETARIO' && rows.some((o) => vigente(o) && o.moradorImovelTipoRelacao === 'MORADOR' && o.moradorId === r.moradorId && o.imovelId === r.imovelId))
        .map((r) => `${r.moradorId}:${r.imovelId}`),
    );
    return rows.map((r) => ({ ...r, _bloco: b[r.imovel?.blocoId], _combo: vigente(r) && ['PROPRIETARIO', 'MORADOR'].includes(r.moradorImovelTipoRelacao) && par.has(`${r.moradorId}:${r.imovelId}`) }));
  },
  chips: [
    { label: 'Todos', filters: {} },
    { label: 'Proprietário', filters: { tipoRelacao: 'PROPRIETARIO' } },
    { label: 'Inquilino', filters: { tipoRelacao: 'INQUILINO' } },
    { label: 'Morador', filters: { tipoRelacao: 'MORADOR' } },
    { label: 'Proprietário + Morador', filters: { combo: 1 } },
    { label: 'Temporada', filters: { tipoRelacao: 'TEMPORADA' } },
  ],
  // "Proprietário + Morador" precisa olhar as duas relações da pessoa juntas, então os filtros são feitos no navegador
  localFilterKeys: ['tipoRelacao', 'combo'],
  localFilter: (r, k, v) => (k === 'combo' ? r._combo === true : r.moradorImovelTipoRelacao === v),
  searchable: false,
  urlFilters: ['moradorId', 'imovelId'],
  fields: [
    { name: 'moradorId', label: 'Morador', col: 'morador_id (FK)', type: 'select', required: true, loadOptions: loadMoradorOptions },
    { name: 'imovelId', label: 'Imóvel', col: 'imovel_id (FK)', type: 'select', required: true, loadOptions: loadImovelOptions },
    {
      // cadastro: "Proprietário + Morador" cria as duas relações de uma vez (a única soma permitida no mesmo imóvel)
      name: '_opcao',
      label: 'Tipo de relação',
      col: 'morador_imovel_tipo_relacao',
      type: 'radio',
      mode: 'create',
      required: true,
      options: OPCOES_RELACAO.map((x) => ({ value: x, label: rotuloOpcao(x) })),
      optionDisabled: (opcao, _sel, values) => motivoOpcaoBloqueada(opcao, values._existentes ?? []),
      fkNote: '"Proprietário + Morador" é para o dono que também mora no imóvel: cadastra as duas relações de uma vez.',
    },
    {
      // edição: uma relação tem um único tipo
      name: 'moradorImovelTipoRelacao',
      label: 'Tipo de relação',
      col: 'morador_imovel_tipo_relacao',
      type: 'radio',
      mode: 'edit',
      required: true,
      options: TIPOS_RELACAO.map((x) => ({ value: x, label: x })),
    },
    { name: 'moradorImovelDataInicio', label: 'Início', col: 'morador_imovel_data_inicio', type: 'data-br', required: true, half: true, validate: validarDataBr },
    { name: 'moradorImovelDataFim', label: 'Fim (opcional)', col: 'morador_imovel_data_fim', type: 'data-br', half: true, validate: validarDataBr },
    { name: 'moradorImovelStatus', label: 'Status', col: 'morador_imovel_status', type: 'toggle', toggleTitle: 'Vínculo ativo', toggleHint: 'Desative ao invés de excluir para manter histórico' },
  ],
  formSubtitle: '',
  defaults: { moradorId: '', imovelId: '', moradorImovelTipoRelacao: 'MORADOR', _opcao: 'MORADOR', _existentes: [], moradorImovelDataInicio: '', moradorImovelDataFim: '', moradorImovelStatus: 1, _acesso: false, _login: '', _senha: '' },
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
  toPayload: (v, mode) =>
    mode === 'create'
      ? corpoCriacao(v, tiposDaOpcao(String(v._opcao))[0])
      : {
          moradorId: v.moradorId,
          imovelId: v.imovelId,
          moradorImovelTipoRelacao: v.moradorImovelTipoRelacao,
          moradorImovelDataInicio: v.moradorImovelDataInicio,
          moradorImovelStatus: v.moradorImovelStatus,
          // ao editar, campo vazio envia null para o back limpar a data de fim
          moradorImovelDataFim: v.moradorImovelDataFim ? v.moradorImovelDataFim : null,
        },
  afterSave: async (saved, v, mode) => {
    if (mode !== 'create') return;
    // O formulário salvou a 1ª relação. Aqui vêm (1) o login e (2) os outros tipos marcados. O login vem antes das
    // outras relações: o backend faz as novas relações do mesmo morador herdarem a conta já existente.
    const erros: string[] = [];
    // Conceder acesso = criar o usuário já ligado a esta relação (POST /usuario com moradorImovelId).
    // Se a relação já herdou a conta do morador (usuarioId preenchido), não há o que criar.
    if (v._acesso && !saved.usuarioId) {
      try {
        await criarUsuario({ usuarioLogin: String(v._login).trim(), senha: v._senha, usuarioPerfil: 'MORADOR', moradorImovelId: saved.moradorImovelId });
      } catch (e) {
        erros.push(t('login não criado ({erro})', { erro: (e as Error).message }));
      }
    }
    for (const tipo of tiposDaOpcao(String(v._opcao)).filter((t) => t !== saved.moradorImovelTipoRelacao)) {
      try {
        await vinculoApi.create(corpoCriacao(v, tipo));
      } catch (e) {
        erros.push(t('relação de {tipo} não criada ({erro})', { tipo: rotuloTipo(tipo), erro: (e as Error).message }));
      }
    }
    limparCache();
    if (erros.length) throw new Error(erros.join('; '));
  },
  rowTitle: (r) => `${r.morador?.moradorNome ?? t('Morador')} · ${r.imovel ? imovelRotulo(r.imovel, r.imovel.bloco?.blocoNome) : t('Imóvel #{id}', { id: r.imovelId })}`,
  idLabel: (r) => `${t('Código')} ${idFmt(r.moradorImovelId)}`,
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
      { icon: '🧍', title: r.morador?.moradorNome ?? t('Morador'), sub: t('Abrir perfil do morador'), to: `/moradores/${r.moradorId}` },
      { icon: '🏠', title: r.imovel ? imovelRotulo(r.imovel, r.imovel.bloco?.blocoNome) : t('Imóvel'), sub: t('Abrir imóvel'), to: `/imoveis/${r.imovelId}` },
    ],
  }),
  extraDetail: (r, reload) => <EncerrarButton row={r} reload={reload} />,
  statusOf: (r) => r.moradorImovelStatus,
  inactivate: { label: 'Desativar', confirm: 'A relação ficará inativa, mas o histórico é mantido.' },
};
