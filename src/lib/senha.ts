import { t } from "@/i18n";

// Política de senha das contas de acesso — a MESMA regra do backend (src/common/validators/senha-forte.ts):
// de 8 a 16 caracteres, com letra maiúscula, minúscula, número e caractere especial.
// A validação aqui orienta quem digita; quem garante a regra é o backend.
export const SENHA_MIN = 8;
export const SENHA_MAX = 16;
// texto em português (a tela traduz pelo dicionário; ver ./i18n/en.ts)
export const SENHA_DICA = `De ${SENHA_MIN} a ${SENHA_MAX} caracteres, com letra maiúscula, minúscula, número e caractere especial.`;

/** Mensagem do primeiro requisito não atendido, ou null se a senha é válida. */
export function validarSenha(senha: unknown): string | null {
  if (typeof senha !== "string" || senha.length === 0) return t("A senha é obrigatória.");
  if (senha.length < SENHA_MIN || senha.length > SENHA_MAX) return t("A senha deve ter entre {min} e {max} caracteres.", { min: SENHA_MIN, max: SENHA_MAX });
  if (!/[A-Z]/.test(senha) || !/[a-z]/.test(senha)) return t("A senha deve ter ao menos uma letra maiúscula e uma minúscula.");
  if (!/\d/.test(senha)) return t("A senha deve ter ao menos um número.");
  if (!/[^A-Za-z0-9]/.test(senha)) return t("A senha deve ter ao menos um caractere especial.");
  return null;
}
