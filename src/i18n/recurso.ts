import type { ResourceConfig } from "@/models/types";
import { ingles, t } from ".";

// Frases montadas a partir da configuração de um recurso (ex.: "Novo bloco", "Bloco criado com sucesso.").
// Em português, o gênero (m/f) do recurso muda as palavras; em inglês, só o nome do recurso (en.ts: "bloco" → "block").
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const novoPt = (cfg: ResourceConfig) => (cfg.gender === "m" ? "Novo" : "Nova");
const o = (cfg: ResourceConfig) => (cfg.gender === "m" ? "o" : "a");

export const textoNovo = (cfg: ResourceConfig) => (ingles() ? `New ${t(cfg.singular)}` : `${novoPt(cfg)} ${cfg.singular}`);
export const textoEditar = (cfg: ResourceConfig) => (ingles() ? `Edit ${t(cfg.singular)}` : `Editar ${cfg.singular}`);
export const textoSalvar = (cfg: ResourceConfig) => (ingles() ? `Save ${t(cfg.singular)}` : `Salvar ${cfg.singular}`);
export const tituloForm = (cfg: ResourceConfig, modo: "create" | "edit") =>
  ingles() ? `${modo === "edit" ? "Edit" : "New"} ${cap(t(cfg.singular))}` : `${modo === "edit" ? "Editar" : novoPt(cfg)} ${cap(cfg.singular)}`;
export const tituloDados = (cfg: ResourceConfig) => (cfg.formTitle ? t(cfg.formTitle) : ingles() ? `${cap(t(cfg.singular))} details` : `Dados d${o(cfg)} ${cfg.singular}`);
export const msgSalvo = (cfg: ResourceConfig, modo: "create" | "edit") =>
  ingles() ? `${cap(t(cfg.singular))} ${modo === "create" ? "created" : "updated"} successfully.` : `${cap(cfg.singular)} ${modo === "create" ? "criad" : "atualizad"}${o(cfg)} com sucesso.`;
export const msgEtapaExtra = (cfg: ResourceConfig, erro: string) =>
  ingles() ? `${cap(t(cfg.singular))} saved, but the extra step failed: ${erro}` : `${cap(cfg.singular)} salv${o(cfg)}, mas a etapa extra falhou: ${erro}`;
