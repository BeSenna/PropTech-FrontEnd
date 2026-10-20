// Recursos dos módulos Financeiro e Serviços (dados simulados no navegador).
// Os nomes dos campos seguem as colunas do banco do futuro microsserviço.
import { competenciaTxt, fmtDate, fmtDateTime, fmtMoney } from '../lib/format';
import type { FieldDef, Option, Rec, ResourceConfig } from '../lib/types';
import { Badge } from '../components/ui';
import { blocoLetra, loadImovelOptions, loadMoradorOptions } from './api';
import {
  areaStore,
  avisoStore,
  cobrancaStore,
  despesaStore,
  manutencaoStore,
  ocorrenciaStore,
  pagamentoStore,
  receitaStore,
  reservaStore,
} from '../mock/data';

const idFmt = (n: number) => `#${String(n).padStart(4, '0')}`;
const ativoTxt = (v: number, f = 'ATIVO', i = 'INATIVO') => (v === 1 ? f : i);
const vazio = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v));
const agora = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const radio = (xs: string[]): Option[] => xs.map((x) => ({ value: x, label: x }));
const horario = (r: Rec) => `${String(r.reserva_horario_inicio).slice(0, 2).replace(/^0/, '')}h – ${String(r.reserva_horario_fim).slice(0, 2).replace(/^0/, '')}h`;

const status = (name: string, titulo: string, hint: string): FieldDef => ({ name, label: 'Status', col: name, type: 'toggle', toggleTitle: titulo, toggleHint: hint });

// Separa "Apto 101 · Bloco A" em rótulo + letra do bloco
const quebraImovel = (label?: string) => {
  const [im, bl] = String(label ?? '').split(' · ');
  return { imovel_label: im || '—', bloco_nome: blocoLetra(bl) };
};

const optsDe = (store: { all(): Rec[] }, label: (r: Rec) => string, onlyActive?: string) => async (): Promise<Option[]> =>
  store
    .all()
    .filter((r) => !onlyActive || r[onlyActive] === 1)
    .map((r) => ({ value: r.id, label: label(r) }));

// ---------------------------------------------------------------- Cobranças
export const cobrancaCfg: ResourceConfig = {
  key: 'cobranca',
  path: '/cobrancas',
  singular: 'cobrança',
  plural: 'Cobranças',
  gender: 'f',
  endpoint: 'GET /cobranca',
  idKey: 'id',
  adapter: cobrancaStore,
  columns: [
    { key: 'imovel_label', label: 'Imóvel', strong: true },
    { key: 'bloco_nome', label: 'Bloco' },
    { key: 'cobranca_competencia', label: 'Competência', render: (r) => competenciaTxt(r.cobranca_competencia), sortValue: (r) => r.cobranca_competencia },
    { key: 'cobranca_valor', label: 'Valor', render: (r) => fmtMoney(r.cobranca_valor), sortValue: (r) => r.cobranca_valor },
    { key: 'cobranca_vencimento', label: 'Vencimento', render: (r) => fmtDate(r.cobranca_vencimento), sortValue: (r) => r.cobranca_vencimento },
    { key: 'cobranca_tipo', label: 'Tipo', render: (r) => <Badge>{r.cobranca_tipo}</Badge> },
    { key: 'cobranca_status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.cobranca_status)}</Badge> },
  ],
  chips: [{ label: 'Todas', filters: {} }, ...['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO'].map((t) => ({ label: t[0] + t.slice(1).toLowerCase(), filters: { cobranca_tipo: t } }))],
  searchable: true,
  searchPlaceholder: 'Buscar por imóvel ou competência...',
  fields: [
    { name: 'imovel_id', label: 'Imóvel', col: 'imovel_id (FK)', type: 'select', required: true, loadOptions: loadImovelOptions, fkNote: '⚑ Referencia imovel.imovel_id no microsserviço Moradores (cross-service).' },
    { name: 'cobranca_descricao', label: 'Descrição', col: 'cobranca_descricao', type: 'text', required: true, placeholder: 'Taxa condominial ordinária' },
    { name: 'cobranca_competencia', label: 'Competência', col: 'cobranca_competencia', type: 'date', required: true, half: true },
    { name: 'cobranca_vencimento', label: 'Vencimento', col: 'cobranca_vencimento', type: 'date', required: true, half: true },
    { name: 'cobranca_valor', label: 'Valor', col: 'cobranca_valor', type: 'money', required: true, half: true, placeholder: '850,00' },
    { name: 'cobranca_tipo', label: 'Tipo', col: 'cobranca_tipo', type: 'radio', options: radio(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']) },
    status('cobranca_status', 'Cobrança ativa', 'Inativas não aparecem nas buscas padrão'),
  ],
  formSubtitle: 'Campos correspondentes à tabela cobranca.',
  defaults: { imovel_id: '', cobranca_descricao: 'Taxa condominial ordinária', cobranca_competencia: '', cobranca_vencimento: '', cobranca_valor: '', cobranca_tipo: 'PENDENTE', cobranca_status: 1 },
  toForm: (r) => ({ ...r }),
  toPayload: (v, mode) => ({
    ...v,
    ...(v.imovel_id__label ? quebraImovel(v.imovel_id__label) : {}),
    ...(mode === 'create'
      ? {
          cobranca_data_criacao: agora(),
          boleto_linha_digitavel: '3419.8172 6009.0128 3000.0000 5 9' + String(Math.round(Number(v.cobranca_valor) * 100)).padStart(5, '0'),
          boleto_data_emissao: v.cobranca_competencia,
        }
      : {}),
  }),
  rowTitle: (r) => `Cobrança · ${r.imovel_label}`,
  idLabel: (r) => `cobranca_id ${idFmt(r.id)}`,
  hasDetail: true,
  hero: {
    kind: 'COBRANÇA',
    color: 'navy',
    badges: (r) => [r.cobranca_tipo],
    sub: (r) => `${fmtMoney(r.cobranca_valor)} · vence em ${fmtDate(r.cobranca_vencimento)}`,
  },
  detailTitle: 'Dados da cobrança',
  detailRows: (r) => [
    ['imovel', `${r.imovel_label} · Bloco ${r.bloco_nome}`],
    ['cobranca_descricao', r.cobranca_descricao],
    ['cobranca_competencia', fmtDate(r.cobranca_competencia)],
    ['cobranca_valor', fmtMoney(r.cobranca_valor)],
    ['cobranca_vencimento', fmtDate(r.cobranca_vencimento)],
    ['cobranca_tipo', r.cobranca_tipo],
    ['cobranca_data_criacao', fmtDateTime(r.cobranca_data_criacao)],
    ['cobranca_status', r.cobranca_status === 1 ? '1 — Ativo' : '0 — Inativo'],
    ['boleto_linha_digitavel', vazio(r.boleto_linha_digitavel)],
    ['boleto_data_emissao', fmtDate(r.boleto_data_emissao)],
  ],
  related: (r) => ({
    title: 'Pagamentos vinculados',
    items: pagamentoStore
      .all()
      .filter((p) => p.cobranca_id === r.id)
      .map((p) => ({ icon: '💳', title: `${fmtMoney(p.pagamento_valor_pago)} · ${p.pagamento_forma_pagamento}`, sub: `Pago em ${fmtDate(p.pagamento_data_pagamento)}`, to: `/pagamentos/${p.id}/editar` })),
    footer: { label: '+ Registrar pagamento', to: `/pagamentos/novo?cobranca_id=${r.id}` },
  }),
  statusOf: (r) => r.cobranca_status,
  inactivate: { label: 'Cancelar cobrança', confirm: 'A cobrança ficará inativa e sairá das buscas padrão.' },
  mockTag: true,
};

// ---------------------------------------------------------------- Pagamentos
const cobrancaLabel = (c: Rec) => `${c.imovel_label} · ${competenciaTxt(c.cobranca_competencia)} · ${fmtMoney(c.cobranca_valor)}`;
export const pagamentoCfg: ResourceConfig = {
  key: 'pagamento',
  path: '/pagamentos',
  singular: 'pagamento',
  plural: 'Pagamentos',
  gender: 'm',
  endpoint: 'GET /pagamento',
  idKey: 'id',
  adapter: pagamentoStore,
  columns: [
    { key: 'competencia_txt', label: 'Cobrança', strong: true },
    { key: 'imovel_label', label: 'Imóvel' },
    { key: 'bloco_nome', label: 'Bloco' },
    { key: 'pagamento_valor_pago', label: 'Valor pago', render: (r) => fmtMoney(r.pagamento_valor_pago), sortValue: (r) => r.pagamento_valor_pago },
    { key: 'pagamento_data_pagamento', label: 'Data', render: (r) => fmtDate(r.pagamento_data_pagamento), sortValue: (r) => r.pagamento_data_pagamento },
    { key: 'pagamento_forma_pagamento', label: 'Forma', render: (r) => <Badge>{r.pagamento_forma_pagamento}</Badge> },
    { key: 'pagamento_status', label: 'Status', render: (r) => <Badge>{r.pagamento_status === 1 ? 'CONFIRMADO' : 'PENDENTE'}</Badge> },
  ],
  chips: [{ label: 'Todos', filters: {} }, { label: 'Pix', filters: { pagamento_forma_pagamento: 'PIX' } }, { label: 'Boleto', filters: { pagamento_forma_pagamento: 'BOLETO' } }, { label: 'Cartão', filters: { pagamento_forma_pagamento: 'CARTAO' } }],
  searchable: true,
  searchPlaceholder: 'Buscar por imóvel ou competência...',
  urlFilters: [],
  fields: [
    { name: 'cobranca_id', label: 'Cobrança', col: 'cobrancas_id (FK)', type: 'select', required: true, loadOptions: optsDe(cobrancaStore, cobrancaLabel), fkNote: '⚑ Referencia cobranca.cobranca_id.' },
    { name: 'pagamento_valor_pago', label: 'Valor pago', col: 'pagamento_valor_pago', type: 'money', required: true, half: true, placeholder: '850,00' },
    { name: 'pagamento_data_pagamento', label: 'Data do pagamento', col: 'pagamento_data_pagamento', type: 'date', required: true, half: true },
    { name: 'pagamento_forma_pagamento', label: 'Forma de pagamento', col: 'pagamento_forma_pagamento', type: 'radio', options: radio(['PIX', 'BOLETO', 'CARTAO']) },
    { name: 'pagamento_observacao', label: 'Observação', col: 'pagamento_observacao', type: 'textarea', placeholder: 'Observações adicionais (opcional)' },
    status('pagamento_status', 'Pagamento confirmado', 'Desmarque se estiver aguardando compensação'),
  ],
  formSubtitle: 'Campos correspondentes à tabela pagamento.',
  defaults: { cobranca_id: '', pagamento_valor_pago: '', pagamento_data_pagamento: '', pagamento_forma_pagamento: 'PIX', pagamento_observacao: '', pagamento_status: 1 },
  toForm: (r) => ({ ...r }),
  toPayload: (v) => {
    const c = cobrancaStore.all().find((x) => x.id === Number(v.cobranca_id));
    return {
      ...v,
      cobranca_id: Number(v.cobranca_id),
      ...(c ? { cobranca_label: cobrancaLabel(c), imovel_label: c.imovel_label, bloco_nome: c.bloco_nome, competencia_txt: competenciaTxt(c.cobranca_competencia) } : {}),
    };
  },
  newLabel: 'Registrar pagamento',
  rowTitle: (r) => `Pagamento · ${r.imovel_label}`,
  idLabel: (r) => `pagamento_id ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.pagamento_status,
  inactivate: { label: 'Cancelar pagamento', confirm: 'O pagamento será marcado como não confirmado.' },
  mockTag: true,
};

// ---------------------------------------------------------------- Despesas
export const despesaCfg: ResourceConfig = {
  key: 'despesa',
  path: '/despesas',
  singular: 'despesa',
  plural: 'Despesas',
  gender: 'f',
  endpoint: 'GET /despesa',
  idKey: 'id',
  adapter: despesaStore,
  columns: [
    { key: 'despesa_descricao', label: 'Descrição', strong: true },
    { key: 'despesa_fornecedor', label: 'Fornecedor' },
    { key: 'despesa_valor', label: 'Valor', render: (r) => fmtMoney(r.despesa_valor), sortValue: (r) => r.despesa_valor },
    { key: 'despesa_data_despesa', label: 'Data', render: (r) => fmtDate(r.despesa_data_despesa), sortValue: (r) => r.despesa_data_despesa },
    { key: 'despesa_categoria', label: 'Categoria' },
    { key: 'despesa_status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.despesa_status)}</Badge> },
  ],
  chips: [{ label: 'Todas', filters: {} }, ...['Manutenção', 'Limpeza', 'Segurança'].map((c) => ({ label: c, filters: { despesa_categoria: c } }))],
  searchable: true,
  searchPlaceholder: 'Buscar por descrição ou fornecedor...',
  fields: [
    { name: 'despesa_descricao', label: 'Descrição', col: 'despesa_descricao', type: 'text', required: true, placeholder: 'Ex.: Manutenção do elevador social' },
    { name: 'despesa_fornecedor', label: 'Fornecedor', col: 'despesa_fornecedor', type: 'text', required: true, placeholder: 'Nome do fornecedor/prestador' },
    { name: 'despesa_valor', label: 'Valor', col: 'despesa_valor', type: 'money', required: true, half: true, placeholder: '0,00' },
    { name: 'despesa_data_despesa', label: 'Data', col: 'despesa_data_despesa', type: 'date', required: true, half: true },
    { name: 'despesa_categoria', label: 'Categoria', col: 'despesa_categoria', type: 'text', required: true, placeholder: 'Ex.: Manutenção, Limpeza, Segurança' },
    status('despesa_status', 'Despesa ativa', 'Inativas não entram nos totais do dashboard'),
  ],
  formSubtitle: 'Campos correspondentes à tabela despesa.',
  defaults: { despesa_descricao: '', despesa_fornecedor: '', despesa_valor: '', despesa_data_despesa: '', despesa_categoria: '', despesa_status: 1 },
  toForm: (r) => ({ ...r }),
  toPayload: (v) => ({ ...v }),
  rowTitle: (r) => r.despesa_descricao,
  idLabel: (r) => `despesa_id ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.despesa_status,
  inactivate: { label: 'Desativar', confirm: 'A despesa deixará de entrar nos totais do dashboard.' },
  mockTag: true,
};

// ---------------------------------------------------------------- Receitas
export const receitaCfg: ResourceConfig = {
  key: 'receita',
  path: '/receitas',
  singular: 'receita',
  plural: 'Receitas',
  gender: 'f',
  endpoint: 'GET /receita',
  idKey: 'id',
  adapter: receitaStore,
  columns: [
    { key: 'receita_descricao', label: 'Descrição', strong: true },
    { key: 'receita_valor', label: 'Valor', render: (r) => fmtMoney(r.receita_valor), sortValue: (r) => r.receita_valor },
    { key: 'receita_data_receita', label: 'Data', render: (r) => fmtDate(r.receita_data_receita), sortValue: (r) => r.receita_data_receita },
    { key: 'receita_categoria', label: 'Categoria' },
    { key: 'receita_status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.receita_status)}</Badge> },
  ],
  chips: [{ label: 'Todas', filters: {} }, { label: 'Aluguel de área', filters: { receita_categoria: 'Aluguel de área' } }, { label: 'Multas', filters: { receita_categoria: 'Multas' } }],
  searchable: true,
  searchPlaceholder: 'Buscar por descrição...',
  fields: [
    { name: 'receita_descricao', label: 'Descrição', col: 'receita_descricao', type: 'text', required: true, placeholder: 'Ex.: Aluguel do salão de festas — setembro' },
    { name: 'receita_valor', label: 'Valor', col: 'receita_valor', type: 'money', required: true, half: true, placeholder: '0,00' },
    { name: 'receita_data_receita', label: 'Data', col: 'receita_data_receita', type: 'date', required: true, half: true },
    { name: 'receita_categoria', label: 'Categoria', col: 'receita_categoria', type: 'text', required: true, placeholder: 'Ex.: Aluguel de área, Multas' },
    status('receita_status', 'Receita ativa', 'Inativas não entram nos totais do dashboard'),
  ],
  formSubtitle: 'Campos correspondentes à tabela receita.',
  defaults: { receita_descricao: '', receita_valor: '', receita_data_receita: '', receita_categoria: '', receita_status: 1 },
  toForm: (r) => ({ ...r }),
  toPayload: (v) => ({ ...v }),
  rowTitle: (r) => r.receita_descricao,
  idLabel: (r) => `receita_id ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.receita_status,
  inactivate: { label: 'Desativar', confirm: 'A receita deixará de entrar nos totais do dashboard.' },
  mockTag: true,
};

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
  formSubtitle: 'Campos correspondentes à tabela area_comum.',
  defaults: { area_comum_nome: '', area_comum_descricao: '', area_comum_capacidade: '', area_comum_status: 1 },
  toForm: (r) => ({ ...r }),
  toPayload: (v) => ({ ...v }),
  rowTitle: (r) => r.area_comum_nome,
  idLabel: (r) => `area_comum_id ${idFmt(r.id)}`,
  hasDetail: true,
  hero: { kind: 'ÁREA COMUM', color: 'green', badges: (r) => [ativoTxt(r.area_comum_status, 'ATIVA', 'INATIVA')], sub: (r) => `Capacidade: ${r.area_comum_capacidade} pessoas` },
  detailTitle: 'Dados da área comum',
  detailRows: (r) => [
    ['area_comum_nome', r.area_comum_nome],
    ['area_comum_descricao', vazio(r.area_comum_descricao)],
    ['area_comum_capacidade', `${r.area_comum_capacidade} pessoas`],
    ['area_comum_status', r.area_comum_status === 1 ? '1 — Ativa' : '0 — Inativa'],
  ],
  related: (r) => {
    const rs = reservaStore.all().filter((x) => x.area_comum_id === r.id);
    return {
      title: 'Reservas vinculadas',
      items: rs.slice(0, 5).map((x) => ({ icon: '📅', title: x.morador_nome, sub: `${fmtDate(x.reserva_data_reserva)} · ${horario(x)} · ${x.reserva_tipo}`, to: `/reservas/${x.id}/editar` })),
      footer: { label: 'Ver todas as reservas', to: '/reservas', hint: `GET /reserva?area_comum_id=${r.id}` },
    };
  },
  detailActions: (r) => [{ label: '+ Nova reserva', to: `/reservas/novo?area_comum_id=${r.id}`, primary: true }],
  statusOf: (r) => r.area_comum_status,
  inactivate: { label: 'Desativar', confirm: 'A área ficará inativa e não aceitará novas reservas.' },
  mockTag: true,
};

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
    { name: 'area_comum_id', label: 'Área comum', col: 'area_comum_id (FK)', type: 'select', required: true, loadOptions: optsDe(areaStore, (a) => a.area_comum_nome, 'area_comum_status'), fkNote: '⚑ Referencia area_comum.area_comum_id.' },
    { name: 'reserva_morador_id', label: 'Morador', col: 'reserva_morador_id (FK)', type: 'select', required: true, loadOptions: loadMoradorOptions, fkNote: '⚑ Referencia morador.morador_id no microsserviço Moradores (cross-service).' },
    { name: 'reserva_data_reserva', label: 'Data da reserva', col: 'reserva_data_reserva', type: 'date', required: true },
    { name: 'reserva_horario_inicio', label: 'Horário início', col: 'reserva_horario_inicio', type: 'time', required: true, half: true },
    { name: 'reserva_horario_fim', label: 'Horário fim', col: 'reserva_horario_fim', type: 'time', required: true, half: true },
    { name: 'reserva_tipo', label: 'Tipo', col: 'reserva_tipo', type: 'radio', options: radio(['PENDENTE', 'CONFIRMADA', 'CANCELADA']) },
    status('reserva_status', 'Reserva ativa', 'Inativas não bloqueiam o horário'),
  ],
  formSubtitle: 'Campos correspondentes à tabela reserva.',
  defaults: { area_comum_id: '', reserva_morador_id: '', reserva_data_reserva: '', reserva_horario_inicio: '', reserva_horario_fim: '', reserva_tipo: 'PENDENTE', reserva_status: 1 },
  toForm: (r) => ({ ...r }),
  toPayload: (v) => ({
    ...v,
    area_comum_id: Number(v.area_comum_id),
    ...(v.area_comum_id__label ? { area_comum_label: v.area_comum_id__label } : {}),
    ...(v.reserva_morador_id__label ? { morador_nome: v.reserva_morador_id__label } : {}),
  }),
  rowTitle: (r) => `${r.area_comum_label} · ${fmtDate(r.reserva_data_reserva)}`,
  idLabel: (r) => `reserva_id ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.reserva_status,
  inactivate: { label: 'Cancelar reserva', confirm: 'A reserva ficará inativa e liberará o horário.' },
  mockTag: true,
};

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
    { name: 'ocorrencia_morador_id', label: 'Morador', col: 'ocorrencia_morador_id (FK)', type: 'select', required: true, loadOptions: loadMoradorOptions, fkNote: '⚑ Referencia morador.morador_id no microsserviço Moradores (cross-service).' },
    { name: 'ocorrencia_titulo', label: 'Título', col: 'ocorrencia_titulo', type: 'text', required: true, placeholder: 'Ex.: Vazamento no teto da garagem' },
    { name: 'ocorrencia_descricao', label: 'Descrição', col: 'ocorrencia_descricao', type: 'textarea', required: true, placeholder: 'Descreva com detalhes o que está acontecendo' },
    { name: 'ocorrencia_tipo', label: 'Tipo', col: 'ocorrencia_tipo', type: 'radio', options: radio(['ABERTA', 'EM_ANDAMENTO', 'FINALIZADA']) },
    status('ocorrencia_status', 'Ocorrência ativa', 'Inativas saem do painel de acompanhamento'),
  ],
  formSubtitle: 'Campos correspondentes à tabela ocorrencia.',
  defaults: { ocorrencia_morador_id: '', ocorrencia_titulo: '', ocorrencia_descricao: '', ocorrencia_tipo: 'ABERTA', ocorrencia_status: 1 },
  toForm: (r) => ({ ...r }),
  toPayload: (v, mode) => ({
    ...v,
    ...(v.ocorrencia_morador_id__label ? { morador_nome: v.ocorrencia_morador_id__label } : {}),
    ...(mode === 'create' ? { ocorrencia_data_ocorrencia: agora() } : {}),
  }),
  rowTitle: (r) => r.ocorrencia_titulo,
  idLabel: (r) => `ocorrencia_id ${idFmt(r.id)}`,
  hasDetail: true,
  hero: { kind: 'OCORRÊNCIA', color: 'amber', badges: (r) => [r.ocorrencia_tipo], sub: (r) => `Reportada por ${r.morador_nome}` },
  detailTitle: 'Dados da ocorrência',
  detailRows: (r) => [
    ['ocorrencia_morador_id', r.morador_nome],
    ['ocorrencia_titulo', r.ocorrencia_titulo],
    ['ocorrencia_descricao', vazio(r.ocorrencia_descricao)],
    ['ocorrencia_data_ocorrencia', fmtDateTime(r.ocorrencia_data_ocorrencia)],
    ['ocorrencia_tipo', r.ocorrencia_tipo],
    ['ocorrencia_status', r.ocorrencia_status === 1 ? '1 — Ativo' : '0 — Inativo'],
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
    { name: 'ocorrencia_id', label: 'Ocorrência', col: 'ocorrencia_id (FK)', type: 'select', required: true, loadOptions: optsDe(ocorrenciaStore, (o) => o.ocorrencia_titulo, 'ocorrencia_status'), fkNote: '⚑ Referencia ocorrencia.ocorrencia_id.' },
    { name: 'manutencao_descricao', label: 'Descrição', col: 'manutencao_descricao', type: 'text', required: true, placeholder: 'Reparo de impermeabilização da laje' },
    { name: 'manutencao_responsavel', label: 'Responsável', col: 'manutencao_responsavel', type: 'text', required: true },
    { name: 'manutencao_data_solicitacao', label: 'Data solicitação', col: 'manutencao_data_solicitacao', type: 'date', required: true, half: true },
    { name: 'manutencao_data_conclusao', label: 'Data conclusão', col: 'manutencao_data_conclusao', type: 'date', half: true },
    { name: 'manutencao_tipo', label: 'Tipo', col: 'manutencao_tipo', type: 'radio', options: radio(['PENDENTE', 'EM_EXECUCAO', 'CONCLUIDA']) },
    status('manutencao_status', 'Manutenção ativa', 'Inativas saem do painel de acompanhamento'),
  ],
  formSubtitle: 'Campos correspondentes à tabela manutencao.',
  defaults: { ocorrencia_id: '', manutencao_descricao: '', manutencao_responsavel: '', manutencao_data_solicitacao: '', manutencao_data_conclusao: '', manutencao_tipo: 'PENDENTE', manutencao_status: 1 },
  urlFilters: [],
  toForm: (r) => ({ ...r }),
  toPayload: (v) => ({ ...v, ocorrencia_id: Number(v.ocorrencia_id), ...(v.ocorrencia_id__label ? { ocorrencia_label: v.ocorrencia_id__label } : {}) }),
  newLabel: 'Registrar manutenção',
  rowTitle: (r) => r.manutencao_descricao,
  idLabel: (r) => `manutencao_id ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.manutencao_status,
  inactivate: { label: 'Desativar', confirm: 'A manutenção sairá do painel de acompanhamento.' },
  mockTag: true,
};

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
  formSubtitle: 'Campos correspondentes à tabela avisos. avisos_data_publicacao é preenchida automaticamente e não é editável.',
  defaults: { avisos_titulo: '', avisos_mensagem: '', avisos_data_expiracao: '', avisos_status: 1 },
  toForm: (r) => ({ ...r, avisos_data_expiracao: String(r.avisos_data_expiracao ?? '').slice(0, 10) }),
  toPayload: (v, mode) => ({ ...v, ...(mode === 'create' ? { avisos_data_publicacao: agora() } : {}) }),
  rowTitle: (r) => r.avisos_titulo,
  idLabel: (r) => `avisos_id ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.avisos_status,
  inactivate: { label: 'Desativar', confirm: 'O aviso deixará de aparecer no mural.' },
  mockTag: true,
};
