import { andarTxt, fmtArea, fmtDate } from '@/lib/format';
import type { Rec, ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { imovelApi, loadBlocoOptions } from '@/services/moradorService';
import { idFmt, ativoTxt, vazio, sv } from './shared';

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
    { name: 'blocoId', label: 'Bloco', col: 'bloco_id (FK)', type: 'select', required: true, loadOptions: loadBlocoOptions },
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
  formSubtitle: '',
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
  idLabel: (r) => `Código ${idFmt(r.imovelId)}`,
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
    ['imovel_status', r.imovelStatus === 1 ? 'Ativa' : 'Inativa'],
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
