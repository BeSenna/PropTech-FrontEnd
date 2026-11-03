export type Perfil = "SINDICO" | "MORADOR";

/** Usuário da sessão (devolvido pelo login e guardado no navegador). */
export interface SessionUser {
  usuarioId: number;
  usuarioLogin: string;
  usuarioPerfil: Perfil;
  moradorId: number | null;
}
