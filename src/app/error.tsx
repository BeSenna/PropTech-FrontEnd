"use client";

import { useEffect } from "react";

// Mostrado quando uma página dá erro inesperado ao renderizar (o resto do layout continua de pé).
// Erros de chamada à API NÃO chegam aqui: as telas os mostram no próprio formulário/lista.
export default function ErroDaPagina({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error); // fica só no console do navegador; o usuário vê uma mensagem amigável
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div role="alert">
        <h1 className="m-0 text-[22px] font-extrabold text-navy">Algo deu errado</h1>
        <p className="mt-1 mb-4 text-muted">Não foi possível exibir esta página. Tente novamente; se continuar, avise o suporte.</p>
        <button type="button" onClick={() => retry()} className="rounded-[9px] bg-primary px-4 py-[9px] text-[12.5px] font-bold text-white">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
