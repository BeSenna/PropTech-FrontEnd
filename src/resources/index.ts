import type { ResourceConfig } from "@/models/types";
import { blocoCfg, imovelCfg, moradorCfg, usuarioCfg, vinculoCfg } from "./moradores";
import { boletoCfg, cobrancaCfg, despesaCfg, pagamentoCfg, receitaCfg } from "./financeiro";
import { areaCfg, avisoCfg, manutencaoCfg, ocorrenciaCfg, reservaCfg } from "./simulados";

// Moradores → API real (MS Moradores). Financeiro → API real (MS Financeiro). Serviços → mock em localStorage (resources/simulados/).
export const RESOURCES: ResourceConfig[] = [blocoCfg, imovelCfg, moradorCfg, vinculoCfg, usuarioCfg, cobrancaCfg, boletoCfg, pagamentoCfg, receitaCfg, despesaCfg, areaCfg, reservaCfg, ocorrenciaCfg, manutencaoCfg, avisoCfg];

/** acha a configuração pelo trecho da URL (ex.: "blocos") */
export const findResource = (slug: string | undefined) => RESOURCES.find((r) => r.path === `/${slug}`);
