import type { ResourceConfig } from "@/lib/types";
import { blocoCfg, imovelCfg, moradorCfg, usuarioCfg, vinculoCfg } from "./moradores";
import { areaCfg, avisoCfg, cobrancaCfg, despesaCfg, manutencaoCfg, ocorrenciaCfg, pagamentoCfg, receitaCfg, reservaCfg } from "./simulados";

// Moradores → API real (MS Moradores). Financeiro e Serviços → mock em localStorage (simulados.tsx).
export const RESOURCES: ResourceConfig[] = [blocoCfg, imovelCfg, moradorCfg, vinculoCfg, usuarioCfg, cobrancaCfg, pagamentoCfg, receitaCfg, despesaCfg, areaCfg, reservaCfg, ocorrenciaCfg, manutencaoCfg, avisoCfg];

/** acha a configuração pelo trecho da URL (ex.: "blocos") */
export const findResource = (slug: string | undefined) => RESOURCES.find((r) => r.path === `/${slug}`);
