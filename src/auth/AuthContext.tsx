import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getToken, http, setToken, setUnauthorizedHandler } from '../lib/http';

export interface SessionUser {
  usuarioId: number;
  usuarioLogin: string;
  usuarioPerfil: 'SINDICO' | 'MORADOR';
  moradorId: number | null;
}

interface AuthState {
  user: SessionUser | null;
  ready: boolean;
  login(login: string, senha: string, esperado?: 'SINDICO' | 'MORADOR'): Promise<SessionUser>;
  logout(): void;
}

const USER_KEY = 'proptech.user';
const Ctx = createContext<AuthState | null>(null);

function readUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw && getToken() ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readUser);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Revalida o token guardado (também pega usuário desativado, já que o back consulta o banco a cada request).
  useEffect(() => {
    let vivo = true;
    (async () => {
      if (getToken()) {
        try {
          const me = await http<{ usuarioId: number; moradorId: number | null; usuarioPerfil: 'SINDICO' | 'MORADOR' }>('/auth/me');
          if (vivo) setUser((u) => (u ? { ...u, usuarioPerfil: me.usuarioPerfil, moradorId: me.moradorId } : u));
        } catch (e) {
          if (vivo && (e as { status?: number }).status === 401) logout();
        }
      }
      if (vivo) setReady(true);
    })();
    return () => {
      vivo = false;
    };
  }, [logout]);

  const login = useCallback(async (usuarioLogin: string, senha: string, esperado?: 'SINDICO' | 'MORADOR') => {
    const r = await http<{ accessToken: string; usuario: SessionUser }>('/auth/login', {
      method: 'POST',
      body: { usuarioLogin, senha },
    });
    // confere o perfil ANTES de guardar a sessão, para não "piscar" dentro do sistema com o botão errado
    if (esperado && r.usuario.usuarioPerfil !== esperado) {
      throw new Error(
        r.usuario.usuarioPerfil === 'SINDICO'
          ? 'Esta conta é de síndico(a). Use o botão "Entrar como Síndico(a)".'
          : 'Esta conta é de morador. Use o botão "Entrar como Morador".',
      );
    }
    setToken(r.accessToken);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(r.usuario));
    } catch {
      /* ignore */
    }
    setUser(r.usuario);
    return r.usuario;
  }, []);

  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fora do AuthProvider');
  return c;
}
