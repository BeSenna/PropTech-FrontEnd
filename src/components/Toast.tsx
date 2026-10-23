"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Kind = "ok" | "erro";
interface T {
  id: number;
  kind: Kind;
  msg: string;
}
const Ctx = createContext<(msg: string, kind?: Kind) => void>(() => {});
let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((msg: string, kind: Kind = "ok") => {
    const id = ++seq;
    setItems((x) => [...x, { id, kind, msg }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed right-5 bottom-5 z-60 grid gap-2" role="status" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className={`rounded-[10px] px-4 py-[11px] text-[12.5px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] ${i.kind === "ok" ? "bg-ok-fg" : "bg-red-700"}`}>
            {i.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
