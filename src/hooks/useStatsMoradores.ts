"use client";

// Totais do dashboard do síndico (módulo Moradores), lidos da API.
import { useEffect, useState } from "react";
import { totalDe } from "@/services/moradorService";

export function useStatsMoradores() {
  const [s, setS] = useState<number[] | null>(null);
  const [erro, setErro] = useState("");
  useEffect(() => {
    let vivo = true;
    Promise.all([totalDe("/bloco"), totalDe("/imovel", { status: 1 }), totalDe("/morador", { status: 1 }), totalDe("/morador-imovel")])
      .then((r) => vivo && setS(r))
      .catch((e) => vivo && setErro((e as Error).message));
    return () => {
      vivo = false;
    };
  }, []);
  return { s, erro };
}
