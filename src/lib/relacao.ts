import { t } from '@/i18n';
import type { Rec } from '@/models/types';

// Regras de relação morador ↔ imóvel (espelham o MS Moradores).
// Uma pessoa pode ter várias relações; no MESMO imóvel só é permitida a soma PROPRIETARIO + MORADOR
// (o dono que também mora lá). Qualquer outra combinação de relações ativas é recusada pelo backend.

export const TIPOS_RELACAO = ['PROPRIETARIO', 'INQUILINO', 'MORADOR', 'TEMPORADA'] as const;

// Opção do cadastro que cria as duas relações de uma vez (dono que também mora no imóvel).
export const OPCAO_PROPRIETARIO_MORADOR = 'PROPRIETARIO+MORADOR';
export const OPCOES_RELACAO = [...TIPOS_RELACAO, OPCAO_PROPRIETARIO_MORADOR];
export const rotuloOpcao = (o: string) => o.split('+').join(' + ');  // o rótulo "A + B" é traduzido na tela (ResourceForm)
export const tiposDaOpcao = (o: string) => o.split('+').filter(Boolean);

export const ROTULO_TIPO: Record<string, string> = {
  PROPRIETARIO: 'Proprietário',
  INQUILINO: 'Inquilino',
  MORADOR: 'Morador',
  TEMPORADA: 'Temporada',
};
export const rotuloTipo = (tipo: string) => t(ROTULO_TIPO[tipo] ?? tipo);

export const combinam = (a: string, b: string) => (a === 'PROPRIETARIO' && b === 'MORADOR') || (a === 'MORADOR' && b === 'PROPRIETARIO');

// Relação em vigor: ativa e ainda não encerrada (o `estado` vem derivado da API).
export const vigente = (v: Rec) => v.moradorImovelStatus === 1 && v.estado !== 'ENCERRADO';

// Motivo pelo qual `tipo` não pode ser marcado agora (ou null). `marcados` são os tipos já escolhidos no formulário
// e `existentes` são as relações que o morador já tem NESTE imóvel (de qualquer estado).
export function motivoTipoBloqueado(tipo: string, marcados: string[], existentes: Rec[]): string | null {
  const mesmo = existentes.find((e) => e.moradorImovelTipoRelacao === tipo);
  if (mesmo) {
    return vigente(mesmo)
      ? t('Este morador já é {tipo} deste imóvel.', { tipo: rotuloTipo(tipo) })
      : t('Já existe uma relação de {tipo} (encerrada ou inativa) neste imóvel. Reabra-a em vez de criar outra.', { tipo: rotuloTipo(tipo) });
  }
  const outros = new Set([...marcados.filter((m) => m !== tipo), ...existentes.filter(vigente).map((e) => String(e.moradorImovelTipoRelacao))]);
  for (const o of outros) {
    if (!combinam(tipo, o)) return t('Não combina com {tipo}. No mesmo imóvel só é permitido Proprietário + Morador.', { tipo: rotuloTipo(o) });
  }
  return null;
}

// Motivo pelo qual a opção do cadastro não está disponível para este morador neste imóvel (ou null).
export const motivoOpcaoBloqueada = (opcao: string, existentes: Rec[]): string | null =>
  tiposDaOpcao(opcao)
    .map((x) => motivoTipoBloqueado(x, [], existentes))
    .find(Boolean) ?? null;

export interface GrupoImovel {
  imovelId: number;
  imovel: Rec | undefined;
  blocoNome: string | undefined;
  tipos: string[];
  relacoes: Rec[];
}

// Relações em vigor agrupadas por imóvel (um imóvel pode ter Proprietário + Morador). Se nenhuma está em vigor,
// cai na mais recente, como a lista sempre fez.
export function gruposDeImoveis(vinculos: Rec[] = []): GrupoImovel[] {
  const base = vinculos.filter(vigente);
  const lista = base.length ? base : vinculos.slice(0, 1);
  const mapa = new Map<number, GrupoImovel>();
  for (const v of lista) {
    const g: GrupoImovel = mapa.get(v.imovelId) ?? { imovelId: v.imovelId, imovel: v.imovel, blocoNome: v.blocoNome ?? v.imovel?.bloco?.blocoNome, tipos: [], relacoes: [] };
    if (!g.tipos.includes(v.moradorImovelTipoRelacao)) g.tipos.push(v.moradorImovelTipoRelacao);
    g.relacoes.push(v);
    mapa.set(v.imovelId, g);
  }
  return [...mapa.values()];
}
