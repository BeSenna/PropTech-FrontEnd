import { cpfValido, fmtCpf, fmtDate, fmtDateTime, onlyDigits, toDateInput } from '@/lib/format';
import type { Rec, ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { blocoLetra, imovelRotulo, moradorApi, vinculosPorMorador } from '@/services/moradorService';
import { idFmt, ativoTxt, vazio, sv, quem } from './shared';

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
  formSubtitle: 'A data de cadastro é preenchida automaticamente.',
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
  idLabel: (r) => `Código ${idFmt(r.moradorId)}`,
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
