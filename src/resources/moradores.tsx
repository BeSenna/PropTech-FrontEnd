// Configuração dos recursos do MS Moradores (API real).
import { http } from '../lib/http';
import { andarTxt, cpfValido, fmtArea, fmtCpf, fmtDate, fmtDateTime, iniciais, onlyDigits, toDateInput } from '../lib/format';
import type { Rec, ResourceConfig } from '../lib/types';
import { Badge } from '../components/ui';
import { EncerrarButton } from '../components/EncerrarButton';
import {
  blocoApi,
  blocoLetra,
  encerrarVinculo as _enc,
  getBlocoMap,
  imovelApi,
  imovelRotulo,
  limparCache,
  loadBlocoOptions,
  loadImovelOptions,
  loadMoradorOptions,
  moradorApi,
  trocarSenha,
  usuarioApi,
  vinculoApi,
  vinculosPorMorador,
} from './api';

void _enc;

const idFmt = (n: number) => `#${String(n).padStart(4, '0')}`;
const ativoTxt = (v: number, f = 'ATIVO', i = 'INATIVO') => (v === 1 ? f : i);
const vazio = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v));
const sv = (fn: (r: Rec) => string | number) => fn;
const quem = (nome: string) => (
  <div className="flex items-center gap-2.5 font-bold">
    <i className="grid size-7 place-items-center rounded-lg bg-soft-blue text-[11px] font-extrabold text-primary not-italic">{iniciais(nome)}</i>
    {nome}
  </div>
);

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
  formSubtitle: 'Campos correspondentes à tabela bloco.',
  defaults: { blocoNome: '', blocoDescricao: '', blocoStatus: 1 },
  toForm: (r) => ({ blocoNome: r.blocoNome, blocoDescricao: r.blocoDescricao ?? '', blocoStatus: r.blocoStatus }),
  toPayload: (v, mode) => ({
    blocoNome: v.blocoNome,
    ...(v.blocoDescricao ? { blocoDescricao: v.blocoDescricao } : mode === 'edit' ? { blocoDescricao: null } : {}),
    blocoStatus: v.blocoStatus,
  }),
  rowTitle: (r) => r.blocoNome,
  idLabel: (r) => `bloco_id ${idFmt(r.blocoId)}`,
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
    ['bloco_status', r.blocoStatus === 1 ? '1 — Ativo' : '0 — Inativo'],
    ['bloco_id', idFmt(r.blocoId)],
  ],
  related: (r) => ({
    title: 'Imóveis do bloco',
    items: (r.imoveis ?? []).slice(0, 8).map((i: Rec) => ({
      icon: '🏠',
      title: `${i.imovelTipo === 'COBERTURA' ? 'Cob.' : 'Apto'} ${i.imovelNumero}`,
      sub: `${i.imovelTipo}${andarTxt(i.imovelAndar)}`,
      to: `/imoveis/${i.imovelId}`,
    })),
    footer: { label: 'Ver todos os imóveis', to: `/imoveis?blocoId=${r.blocoId}`, hint: `GET /imovel?bloco_id=${r.blocoId}` },
  }),
  statusOf: (r) => r.blocoStatus,
  inactivate: { label: 'Desativar', confirm: 'O bloco ficará inativo e não receberá novos imóveis. O histórico é mantido.' },
};

// ---------------------------------------------------------------- Imóveis
export const imovelCfg: ResourceConfig = {
  key: 'imovel',
  path: '/imoveis',
  singular: 'imóvel',
  plural: 'Imóveis',
  gender: 'm',
  endpoint: 'GET /imovel',
  idKey: 'imovelId',
  adapter: imovelApi,
  columns: [
    {
      key: 'imovelNumero',
      label: 'Imóvel',
      strong: true,
      render: (r) => `${r.imovelNumero}${andarTxt(r.imovelAndar)}`,
      sortValue: sv((r) => String(r.imovelNumero).padStart(6, '0')),
    },
    { key: 'bloco', label: 'Bloco', render: (r) => r.bloco?.blocoNome ?? '—', sortValue: sv((r) => r.bloco?.blocoNome ?? '') },
    { key: 'imovelTipo', label: 'Tipo', render: (r) => <Badge>{r.imovelTipo}</Badge>, sortValue: sv((r) => r.imovelTipo) },
    { key: 'imovelAreaM2', label: 'Área', render: (r) => fmtArea(r.imovelAreaM2), sortValue: sv((r) => Number(r.imovelAreaM2 ?? 0)) },
    { key: 'imovelMatricula', label: 'Matrícula', render: (r) => vazio(r.imovelMatricula) },
    { key: 'imovelIptu', label: 'IPTU', render: (r) => vazio(r.imovelIptu) },
    { key: 'imovelStatus', label: 'Status', render: (r) => <Badge>{ativoTxt(r.imovelStatus, 'ATIVA', 'INATIVA')}</Badge>, sortValue: sv((r) => r.imovelStatus) },
  ],
  chips: [
    { label: 'Todos', filters: {} },
    { label: 'Apartamentos', filters: { tipo: 'APARTAMENTO' } },
    { label: 'Coberturas', filters: { tipo: 'COBERTURA' } },
  ],
  searchable: false,
  urlFilters: ['blocoId'],
  selectFilters: [{ param: 'blocoId', label: 'Bloco', load: loadBlocoOptions }],
  fields: [
    { name: 'blocoId', label: 'Bloco', col: 'bloco_id (FK)', type: 'select', required: true, loadOptions: loadBlocoOptions, fkNote: '⚑ Referencia bloco.bloco_id.' },
    { name: 'imovelNumero', label: 'Número', col: 'imovel_numero', type: 'text', required: true, maxLength: 20, half: true, placeholder: 'Ex.: 101' },
    { name: 'imovelAndar', label: 'Andar', col: 'imovel_andar', type: 'number', half: true, placeholder: 'Ex.: 1' },
    {
      name: 'imovelTipo',
      label: 'Tipo',
      col: 'imovel_tipo',
      type: 'radio',
      required: true,
      options: [
        { value: 'APARTAMENTO', label: 'APARTAMENTO' },
        { value: 'COBERTURA', label: 'COBERTURA' },
      ],
    },
    { name: 'imovelAreaM2', label: 'Área (m²)', col: 'imovel_area_m2', type: 'number', step: '0.01', min: 0, half: true, placeholder: '68,00' },
    { name: 'imovelGaragem', label: 'Vagas de garagem', col: 'imovel_garagem', type: 'number', min: 0, half: true, placeholder: '1' },
    { name: 'imovelMatricula', label: 'Matrícula', col: 'imovel_matricula', type: 'text', maxLength: 8, half: true, placeholder: '4471203' },
    { name: 'imovelIptu', label: 'IPTU', col: 'imovel_IPTU', type: 'text', maxLength: 24, half: true, placeholder: '21.334.502-0091' },
    { name: 'imovelStatus', label: 'Status', col: 'imovel_status', type: 'toggle', toggleTitle: 'Imóvel ativo', toggleHint: 'Inativos ficam ocultos nas buscas padrão' },
  ],
  formSubtitle: 'Campos correspondentes à tabela imovel.',
  defaults: { blocoId: '', imovelNumero: '', imovelAndar: '', imovelTipo: 'APARTAMENTO', imovelAreaM2: '', imovelGaragem: '', imovelMatricula: '', imovelIptu: '', imovelStatus: 1 },
  toForm: (r) => ({
    blocoId: r.blocoId,
    imovelNumero: r.imovelNumero,
    imovelAndar: r.imovelAndar ?? '',
    imovelTipo: r.imovelTipo,
    imovelAreaM2: r.imovelAreaM2 ?? '',
    imovelGaragem: r.imovelGaragem ?? '',
    imovelMatricula: r.imovelMatricula ?? '',
    imovelIptu: r.imovelIptu ?? '',
    imovelStatus: r.imovelStatus,
  }),
  toPayload: (v, mode) => {
    const opt = (k: string) => (v[k] === '' || v[k] === undefined ? (mode === 'edit' ? { [k]: null } : {}) : { [k]: v[k] });
    return {
      blocoId: v.blocoId,
      imovelNumero: v.imovelNumero,
      imovelTipo: v.imovelTipo,
      imovelStatus: v.imovelStatus,
      ...opt('imovelAndar'),
      ...opt('imovelAreaM2'),
      ...opt('imovelGaragem'),
      ...opt('imovelMatricula'),
      ...opt('imovelIptu'),
    };
  },
  rowTitle: (r) => `${r.imovelTipo === 'COBERTURA' ? 'Cob.' : 'Apto'} ${r.imovelNumero}${r.bloco?.blocoNome ? ` · ${r.bloco.blocoNome}` : ''}`,
  idLabel: (r) => `imovel_id ${idFmt(r.imovelId)}`,
  hasDetail: true,
  hero: {
    kind: 'IMÓVEL',
    color: 'green',
    badges: (r) => [ativoTxt(r.imovelStatus, 'ATIVA', 'INATIVA'), r.imovelTipo],
  },
  detailTitle: 'Dados do imóvel',
  detailRows: (r) => [
    ['imovel_numero', r.imovelNumero],
    ['imovel_andar', vazio(r.imovelAndar)],
    ['bloco_id', r.bloco ? `${r.bloco.blocoNome} (${idFmt(r.blocoId)})` : idFmt(r.blocoId)],
    ['imovel_tipo', r.imovelTipo],
    ['imovel_area_m2', fmtArea(r.imovelAreaM2)],
    ['imovel_matricula', vazio(r.imovelMatricula)],
    ['imovel_IPTU', vazio(r.imovelIptu)],
    ['imovel_garagem', r.imovelGaragem === null || r.imovelGaragem === undefined ? '—' : `${r.imovelGaragem} vaga${r.imovelGaragem === 1 ? '' : 's'}`],
    ['imovel_status', r.imovelStatus === 1 ? '1 — Ativa' : '0 — Inativa'],
  ],
  related: (r) => ({
    title: 'Moradores vinculados',
    items: (r.moradorImoveis ?? []).map((v: Rec) => ({
      icon: '🧍',
      title: v.morador?.moradorNome ?? `Morador #${v.moradorId}`,
      sub: `${v.moradorImovelTipoRelacao} · desde ${fmtDate(v.moradorImovelDataInicio)}`,
      to: `/moradores/${v.moradorId}`,
    })),
  }),
  detailActions: (r) => [{ label: '+ Relação', to: `/vinculos/novo?imovelId=${r.imovelId}`, primary: true }],
  statusOf: (r) => r.imovelStatus,
  inactivate: { label: 'Desativar', confirm: 'O imóvel ficará inativo. Os vínculos existentes são mantidos.' },
};

// ---------------------------------------------------------------- Moradores
const vinculoAtual = (vs: Rec[] = []) => vs.find((v) => v.estado !== 'ENCERRADO' && v.moradorImovelStatus === 1) ?? vs[0];

export const moradorCfg: ResourceConfig = {
  key: 'morador',
  path: '/moradores',
  singular: 'morador',
  plural: 'Moradores',
  gender: 'm',
  endpoint: 'GET /morador',
  idKey: 'moradorId',
  adapter: moradorApi,
  columns: [
    { key: 'moradorNome', label: 'Morador', render: (r) => quem(r.moradorNome), sortValue: sv((r) => r.moradorNome) },
    { key: 'moradorCpf', label: 'CPF', render: (r) => fmtCpf(r.moradorCpf) },
    { key: 'contato', label: 'Contato', render: (r) => r.moradorEmail || r.moradorTelefone || '—' },
    {
      key: 'imovel',
      label: 'Imóvel',
      render: (r) => {
        const v = vinculoAtual(r._vinculos);
        return v ? `Apto ${v.imovel?.imovelNumero}` : '—';
      },
    },
    { key: 'bloco', label: 'Bloco', render: (r) => blocoLetra(vinculoAtual(r._vinculos)?.blocoNome) },
    {
      key: 'relacao',
      label: 'Relação',
      render: (r) => {
        const v = vinculoAtual(r._vinculos);
        return v ? <Badge>{v.moradorImovelTipoRelacao}</Badge> : '—';
      },
    },
    { key: 'moradorStatus', label: 'Status', render: (r) => <Badge>{ativoTxt(r.moradorStatus)}</Badge>, sortValue: sv((r) => r.moradorStatus) },
  ],
  enrich: async (rows) => {
    const m = await vinculosPorMorador();
    return rows.map((r) => ({ ...r, _vinculos: m[r.moradorId] ?? [] }));
  },
  chips: [
    { label: 'Todos', filters: {} },
    { label: 'Proprietários', filters: { relacao: 'PROPRIETARIO' } },
    { label: 'Inquilinos', filters: { relacao: 'INQUILINO' } },
    { label: 'Moradores', filters: { relacao: 'MORADOR' } },
    { label: 'Temporada', filters: { relacao: 'TEMPORADA' } },
  ],
  localFilterKeys: ['relacao'],
  localFilter: (r, k, v) => k !== 'relacao' || (r._vinculos ?? []).some((x: Rec) => x.moradorImovelTipoRelacao === v && x.estado !== 'ENCERRADO'),
  searchable: true,
  searchPlaceholder: 'Buscar por nome, CPF ou e-mail...',
  fields: [
    { name: 'moradorNome', label: 'Nome completo', col: 'morador_nome', type: 'text', required: true, maxLength: 300 },
    { name: 'moradorCpf', label: 'CPF', col: 'morador_cpf', type: 'text', required: true, half: true, maxLength: 14, placeholder: '000.000.000-00', fkNote: 'Informe um CPF válido (os dígitos verificadores são conferidos).', validate: (v) => (cpfValido(String(v)) ? null : 'CPF inválido. Confira os números digitados.') },
    { name: 'moradorDataNascimento', label: 'Nascimento', col: 'morador_data_nascimento', type: 'date', half: true },
    { name: 'moradorEmail', label: 'E-mail', col: 'morador_email', type: 'text', half: true, maxLength: 150, placeholder: 'nome@email.com' },
    { name: 'moradorTelefone', label: 'Telefone', col: 'morador_telefone', type: 'text', half: true, maxLength: 20, placeholder: '(21) 90000-0000' },
    { name: 'moradorDeficienciaLocomocao', label: 'Necessidade especial', col: 'morador_deficiencia_locomocao', type: 'toggle', toggleTitle: 'Possui deficiência', toggleHint: 'Prioridade em áreas comuns' },
    { name: 'moradorStatus', label: 'Status', col: 'morador_status', type: 'toggle', toggleTitle: 'Morador ativo', toggleHint: 'Inativos perdem acesso ao portal' },
  ],
  formSubtitle: 'Campos correspondentes à tabela morador. morador_data_cadastro é preenchido automaticamente e não é editável.',
  formTitle: 'Dados pessoais',
  defaults: { moradorNome: '', moradorCpf: '', moradorDataNascimento: '', moradorEmail: '', moradorTelefone: '', moradorDeficienciaLocomocao: 0, moradorStatus: 1 },
  toForm: (r) => ({
    moradorNome: r.moradorNome,
    moradorCpf: fmtCpf(r.moradorCpf),
    moradorDataNascimento: toDateInput(r.moradorDataNascimento),
    moradorEmail: r.moradorEmail ?? '',
    moradorTelefone: r.moradorTelefone ?? '',
    moradorDeficienciaLocomocao: r.moradorDeficienciaLocomocao ?? 0,
    moradorStatus: r.moradorStatus,
  }),
  toPayload: (v, mode) => {
    const opt = (k: string) => (v[k] ? { [k]: v[k] } : mode === 'edit' ? { [k]: null } : {});
    return {
      moradorNome: v.moradorNome,
      moradorCpf: onlyDigits(v.moradorCpf),
      moradorDeficienciaLocomocao: v.moradorDeficienciaLocomocao,
      moradorStatus: v.moradorStatus,
      ...opt('moradorEmail'),
      ...opt('moradorTelefone'),
      ...opt('moradorDataNascimento'),
    };
  },
  rowTitle: (r) => r.moradorNome,
  idLabel: (r) => `morador_id ${idFmt(r.moradorId)}`,
  hasDetail: true,
  hero: {
    kind: 'MORADOR',
    color: 'amber',
    badges: (r) => [ativoTxt(r.moradorStatus), ...new Set<string>((r.moradorImoveis ?? []).filter((v: Rec) => v.moradorImovelStatus === 1).map((v: Rec) => v.moradorImovelTipoRelacao))],
  },
  detailTitle: 'Dados pessoais',
  detailRows: (r) => [
    ['morador_nome', r.moradorNome],
    ['morador_cpf', fmtCpf(r.moradorCpf)],
    ['morador_email', vazio(r.moradorEmail)],
    ['morador_telefone', vazio(r.moradorTelefone)],
    ['morador_data_nascimento', fmtDate(r.moradorDataNascimento)],
    ['morador_deficiencia_locomocao', r.moradorDeficienciaLocomocao === 1 ? 'Sim' : 'Não'],
    ['morador_data_cadastro', fmtDateTime(r.moradorDataCadastro)],
  ],
  related: (r) => ({
    title: 'Imóveis vinculados',
    items: (r.moradorImoveis ?? []).map((v: Rec) => ({
      icon: '🏠',
      title: imovelRotulo(v.imovel, v.imovel?.bloco?.blocoNome),
      sub: `${v.moradorImovelTipoRelacao} · desde ${fmtDate(v.moradorImovelDataInicio)}${v.moradorImovelDataFim ? ` · até ${fmtDate(v.moradorImovelDataFim)}` : ''}`,
      to: `/vinculos/${v.moradorImovelId}`,
    })),
  }),
  detailActions: (r) => [{ label: '+ Relação', to: `/vinculos/novo?moradorId=${r.moradorId}`, primary: true }],
  statusOf: (r) => r.moradorStatus,
  inactivate: { label: 'Desativar', confirm: 'O morador ficará inativo e perderá o acesso ao portal.' },
};

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
    { name: 'moradorId', label: 'Morador', col: 'morador_id (FK)', type: 'select', required: true, loadOptions: loadMoradorOptions, fkNote: '⚑ Referencia morador.morador_id.' },
    { name: 'imovelId', label: 'Imóvel', col: 'imovel_id (FK)', type: 'select', required: true, loadOptions: loadImovelOptions, fkNote: '⚑ Referencia imovel.imovel_id.' },
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
  formSubtitle: 'Campos correspondentes à tabela associativa morador_imovel.',
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
  toPayload: (v) => ({
    moradorId: v.moradorId,
    imovelId: v.imovelId,
    moradorImovelTipoRelacao: v.moradorImovelTipoRelacao,
    moradorImovelDataInicio: v.moradorImovelDataInicio,
    moradorImovelStatus: v.moradorImovelStatus,
    ...(v.moradorImovelDataFim ? { moradorImovelDataFim: v.moradorImovelDataFim } : {}),
  }),
  afterSave: async (saved, v, mode) => {
    // Conceder acesso = criar o usuário já ligado a esta relação (POST /usuario com moradorImovelId)
    if (mode === 'create' && v._acesso) {
      await http('/usuario', {
        method: 'POST',
        body: { usuarioLogin: String(v._login).trim(), senha: v._senha, usuarioPerfil: 'MORADOR', moradorImovelId: saved.moradorImovelId },
      });
      limparCache();
    }
  },
  rowTitle: (r) => `${r.morador?.moradorNome ?? 'Morador'} · ${r.imovel ? imovelRotulo(r.imovel, r.imovel.bloco?.blocoNome) : `Imóvel #${r.imovelId}`}`,
  idLabel: (r) => `morador_imovel_id ${idFmt(r.moradorImovelId)}`,
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
    ['morador_imovel_status', r.moradorImovelStatus === 1 ? '1 — Ativo' : '0 — Inativo'],
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

// ---------------------------------------------------------------- Usuários (contas de acesso)
export const usuarioCfg: ResourceConfig = {
  key: 'usuario',
  path: '/usuarios',
  singular: 'usuário',
  plural: 'Usuários',
  gender: 'm',
  endpoint: 'GET /usuario',
  idKey: 'usuarioId',
  adapter: usuarioApi,
  columns: [
    { key: 'usuarioLogin', label: 'Login', strong: true, sortValue: sv((r) => r.usuarioLogin) },
    { key: 'usuarioPerfil', label: 'Perfil', render: (r) => <Badge>{r.usuarioPerfil}</Badge> },
    { key: 'usuarioDataCriacao', label: 'Criado em', render: (r) => fmtDate(r.usuarioDataCriacao) },
    { key: 'usuarioUltimoAcesso', label: 'Último acesso', render: (r) => fmtDateTime(r.usuarioUltimoAcesso) },
    { key: 'usuarioStatus', label: 'Status', render: (r) => <Badge>{ativoTxt(r.usuarioStatus)}</Badge> },
  ],
  chips: [
    { label: 'Todos', filters: {} },
    { label: 'Síndicos', filters: { perfil: 'SINDICO' } },
    { label: 'Moradores', filters: { perfil: 'MORADOR' } },
  ],
  searchable: false,
  fields: [
    { name: 'usuarioLogin', label: 'Login', col: 'usuario_login', type: 'text', required: true, maxLength: 100, placeholder: 'seu.login' },
    { name: 'senha', label: 'Senha', col: 'senha (mín. 8 caracteres)', type: 'password', required: true, mode: 'create', placeholder: '••••••••' },
    { name: 'novaSenha', label: 'Nova senha (opcional)', col: 'trocar senha', type: 'password', mode: 'edit', placeholder: 'Deixe em branco para manter' },
    {
      name: 'usuarioPerfil',
      label: 'Perfil',
      col: 'usuario_perfil',
      type: 'radio',
      options: [
        { value: 'MORADOR', label: 'MORADOR' },
        { value: 'SINDICO', label: 'SINDICO' },
      ],
    },
    { name: 'usuarioStatus', label: 'Status', col: 'usuario_status', type: 'toggle', toggleTitle: 'Conta ativa', toggleHint: 'Desativar bloqueia também os tokens já emitidos' },
  ],
  formSubtitle: 'Contas de acesso ao sistema (tabela usuario). A senha nunca é exibida.',
  defaults: { usuarioLogin: '', senha: '', novaSenha: '', usuarioPerfil: 'MORADOR', usuarioStatus: 1 },
  toForm: (r) => ({ usuarioLogin: r.usuarioLogin, novaSenha: '', usuarioPerfil: r.usuarioPerfil, usuarioStatus: r.usuarioStatus }),
  toPayload: (v, mode) => ({
    usuarioLogin: String(v.usuarioLogin).trim(),
    usuarioPerfil: v.usuarioPerfil,
    usuarioStatus: v.usuarioStatus,
    ...(mode === 'create' ? { senha: v.senha } : {}),
  }),
  afterSave: async (saved, v, mode) => {
    if (mode === 'edit' && v.novaSenha) await trocarSenha(saved.usuarioId, v.novaSenha);
  },
  rowTitle: (r) => r.usuarioLogin,
  idLabel: (r) => `usuario_id ${idFmt(r.usuarioId)}`,
  hasDetail: false,
  statusOf: (r) => r.usuarioStatus,
  inactivate: { label: 'Desativar', confirm: 'O acesso será revogado imediatamente (inclusive tokens já emitidos).' },
};
