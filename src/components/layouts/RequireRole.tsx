"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Loading } from "@/components/ui";

/** Só renderiza o conteúdo depois de a sessão ser lida (no navegador) e o perfil conferir. */
export function RequireRole({ role, children }: { role: "SINDICO" | "MORADOR"; children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const destino = !ready ? null : !user ? "/login" : user.usuarioPerfil !== role ? (user.usuarioPerfil === "SINDICO" ? "/" : "/portal") : null;

  useEffect(() => {
    if (destino) router.replace(destino);
  }, [destino, router]);

  if (!ready || destino || !user) return <Loading />;
  return <>{children}</>;
}
