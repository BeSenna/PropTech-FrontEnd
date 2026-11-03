// Autenticação no MS Moradores (login e consulta da sessão atual).
import { http } from "@/services/http";
import type { Perfil, SessionUser } from "@/models/sessao";

export const entrar = (usuarioLogin: string, senha: string) =>
  http<{ accessToken: string; usuario: SessionUser }>("/auth/login", { method: "POST", body: { usuarioLogin, senha } });

export const sessaoAtual = () => http<{ usuarioId: number; moradorId: number | null; usuarioPerfil: Perfil }>("/auth/me");
