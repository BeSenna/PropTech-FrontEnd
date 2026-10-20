import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Kind = 'ok' | 'erro';
interface T {
  id: number;
  kind: Kind;
  msg: string;
}
const Ctx = createContext<(msg: string, kind?: Kind) => void>(() => {});
let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((msg: string, kind: Kind = 'ok') => {
    const id = ++seq;
    setItems((x) => [...x, { id, kind, msg }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className={`toast toast-${i.kind}`}>
            {i.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
