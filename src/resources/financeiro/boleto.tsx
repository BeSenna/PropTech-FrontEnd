import { competenciaTxt, fmtDate } from '@/lib/format';
import type { ResourceConfig } from '@/models/types';
import { Badge } from '@/components/ui';
import { boletoApi, comImovel, loadCobrancaSemBoletoOptions } from '@/services/financeiroService';
import { loadImovelOptions } from '@/services/moradorService';
import { idFmt, ativoTxt, sv, vazio } from '../moradores/shared';
import { status } from '../simulados/shared';

// ---------------------------------------------------------------- Boletos (MS Financeiro, API real)
// Aqui o boleto é só um cadastro (linha digitável, código de barras e link do PDF): não há emissão bancária.
export const boletoCfg: ResourceConfig = {
  key: 'boleto',
  path: '/boletos',
  singular: 'boleto',
  plural: 'Boletos',
  gender: 'm',
  endpoint: 'GET /boletos',
  idKey: 'id',
  adapter: boletoApi,
  enrich: (rows) => comImovel(rows, (r) => r.cobranca?.imovelId),
  columns: [
    { key: '_imovel', label: 'Imóvel', strong: true, sortValue: sv((r) => r._imovel) },
    { key: '_competencia', label: 'Competência', render: (r) => competenciaTxt(r.cobranca?.competencia), sortValue: sv((r) => r.cobranca?.competencia ?? '') },
    { key: 'linhaDigitavel', label: 'Linha digitável', render: (r) => vazio(r.linhaDigitavel) },
    { key: 'codigoBarras', label: 'Código de barras', render: (r) => vazio(r.codigoBarras) },
    { key: 'dataEmissao', label: 'Cadastro', render: (r) => fmtDate(r.dataEmissao), sortValue: sv((r) => r.dataEmissao) },
    { key: 'status', label: 'Status', render: (r) => <Badge>{ativoTxt(r.status)}</Badge> },
  ],
  searchable: false,
  urlFilters: ['cobrancaId', 'imovelId'],
  selectFilters: [{ param: 'imovelId', label: 'Imóvel', load: loadImovelOptions }],
  fields: [
    { name: 'cobrancaId', label: 'Cobrança', col: 'cobranca_id (FK)', type: 'select', required: true, mode: 'create', loadOptions: loadCobrancaSemBoletoOptions, fkNote: 'Cada cobrança tem no máximo um boleto.' },
    { name: 'linhaDigitavel', label: 'Linha digitável', col: 'boleto_linha_digitavel', type: 'text', maxLength: 255, placeholder: '34191.79001 01043.510047 91020.150008 5 ...' },
    { name: 'codigoBarras', label: 'Código de barras', col: 'boleto_codigo_barras', type: 'text', maxLength: 255 },
    { name: 'urlPdf', label: 'Link do PDF', col: 'boleto_url_pdf', type: 'text', maxLength: 500, placeholder: 'https://...' },
    status('status', 'Boleto ativo', 'Inativos deixam de aparecer para o morador'),
  ],
  formSubtitle: '',
  defaults: { cobrancaId: '', linhaDigitavel: '', codigoBarras: '', urlPdf: '', status: 1 },
  toForm: (r) => ({ linhaDigitavel: r.linhaDigitavel ?? '', codigoBarras: r.codigoBarras ?? '', urlPdf: r.urlPdf ?? '', status: r.status }),
  toPayload: (v, mode) => {
    // vazio ao criar: não envia (o campo é opcional); ao editar: envia null não é aceito, então só manda o que tem valor
    const texto = (x: unknown) => (typeof x === 'string' && x.trim() ? x.trim() : undefined);
    return {
      ...(mode === 'create' ? { cobrancaId: Number(v.cobrancaId) } : {}),
      ...(texto(v.linhaDigitavel) ? { linhaDigitavel: texto(v.linhaDigitavel) } : {}),
      ...(texto(v.codigoBarras) ? { codigoBarras: texto(v.codigoBarras) } : {}),
      ...(texto(v.urlPdf) ? { urlPdf: texto(v.urlPdf) } : {}),
      status: v.status,
    };
  },
  newLabel: 'Cadastrar boleto',
  rowTitle: (r) => `Boleto · ${r._imovel ?? ''}`,
  idLabel: (r) => `Código ${idFmt(r.id)}`,
  hasDetail: false,
  statusOf: (r) => r.status,
  inactivate: { label: 'Inativar', confirm: 'O boleto ficará inativo.' },
};
