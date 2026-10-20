import { createContext, useContext, useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { iniciais } from '../lib/format';
import type { Rec } from '../lib/types';
import { blocoApi, moradorApi, totalDe } from '../resources/api';
import { vinculoApi, imovelApi } from '../resources/api';
import { areaStore, cobrancaStore, despesaStore, manutencaoStore, ocorrenciaStore, pagamentoStore, receitaStore, reservaStore, avisoStore, semearPortal } from '../mock/data';
import { imovelRotulo, blocoLetra } from '../resources/api';
import { ErrorBox, Loading } from '../components/ui';

void blocoApi;
void imovelApi;
void vinculoApi;
void moradorApi;

const ROTULOS: Record<string, string> = {
  cadastros: 'Cadastros',
  blocos: 'Blocos',
  imoveis: 'Imóveis',
  moradores: 'Moradores',
  vinculos: 'Relação',
  usuarios: 'Usuários',
  financeiro: 'Financeiro',
  cobrancas: 'Cobranças',
  pagamentos: 'Pagamentos',
  despesas: 'Despesas',
  receitas: 'Receitas',
  servicos: 'Serviços',
  'areas-comuns': 'Áreas Comuns',
  reservas: 'Reservas',
  ocorrencias: 'Ocorrências',
  manutencoes: 'Manutenções',
  avisos: 'Avisos',
};

type Counts = Record<string, number>;

async function carregarContagens(): Promise<Counts> {
  const c: Counts = {
    areas: areaStore.count(),
    reservas: reservaStore.count(),
    cobrancas: cobrancaStore.count(),
    pagamentos: pagamentoStore.count(),
    despesas: despesaStore.count(),
    receitas: receitaStore.count(),
    ocorrencias: ocorrenciaStore.count(),
    manutencoes: manutencaoStore.count(),
    avisos: avisoStore.count(),
  };
  try {
    const [b, i, m, v] = await Promise.all([totalDe('/bloco'), totalDe('/imovel'), totalDe('/morador'), totalDe('/morador-imovel')]);
    Object.assign(c, { blocos: b, imoveis: i, moradores: m, vinculos: v });
  } catch {
    /* API fora do ar: o conteúdo das telas mostra o erro; o menu segue sem contagem */
  }
  return c;
}

function Item({ to, label, n, sub, end }: { to: string; label: string; n?: number; sub?: boolean; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `side-link ${sub ? 'sub' : ''} ${to === '/' ? 'top' : ''} ${isActive ? 'active' : ''}`}>
      {label}
      {n !== undefined && <span className="n">{n}</span>}
    </NavLink>
  );
}

export function SindicoLayout() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [counts, setCounts] = useState<Counts>({});
  const [q, setQ] = useState('');

  useEffect(() => {
    let vivo = true;
    carregarContagens().then((c) => vivo && setCounts(c));
    return () => {
      vivo = false;
    };
  }, [loc.pathname]);

  const segs = loc.pathname.split('/').filter(Boolean);
  const crumbs: { label: string; to?: string }[] = [{ label: 'Dashboard', to: '/' }];
  if (segs[0]) crumbs.push({ label: ROTULOS[segs[0]] ?? segs[0], to: segs.length > 1 ? `/${segs[0]}` : undefined });
  if (segs[1]) crumbs.push({ label: segs[1] === 'novo' ? 'Novo' : `#${segs[1]}`, to: segs[2] ? `/${segs[0]}/${segs[1]}` : undefined });
  if (segs[2]) crumbs.push({ label: 'Editar' });

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    nav(`/moradores?busca=${encodeURIComponent(q)}`);
  };

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Menu principal">
        <div className="brand">
          <div className="logo">PT</div>
          <div>
            <strong>PropTech</strong>
            <small>condominio_moradores</small>
          </div>
        </div>
        <div className="side-label">Início</div>
        <Item to="/" label="Dashboard" end />

        <div className="side-group">Cadastros</div>
        <Item to="/cadastros" label="Visão Geral" />
        <Item to="/blocos" label="Blocos" n={counts.blocos} />
        <Item to="/imoveis" label="Imóveis" n={counts.imoveis} />
        <Item to="/vinculos" label="Relação" n={counts.vinculos} sub />
        <Item to="/moradores" label="Moradores" n={counts.moradores} />
        <Item to="/usuarios" label="Usuários" />

        <div className="side-group">Financeiro</div>
        <Item to="/financeiro" label="Visão Geral" />
        <Item to="/cobrancas" label="Cobranças" n={counts.cobrancas} />
        <Item to="/pagamentos" label="Pagamentos" n={counts.pagamentos} sub />
        <Item to="/despesas" label="Despesas" n={counts.despesas} />
        <Item to="/receitas" label="Receitas" n={counts.receitas} />

        <div className="side-group">Serviços</div>
        <Item to="/servicos" label="Visão Geral (Serviços)" />
        <Item to="/areas-comuns" label="Áreas Comuns" n={counts.areas} />
        <Item to="/reservas" label="Reservas" n={counts.reservas} sub />
        <Item to="/ocorrencias" label="Ocorrências" n={counts.ocorrencias} />
        <Item to="/manutencoes" label="Manutenções" n={counts.manutencoes} sub />
        <Item to="/avisos" label="Avisos" n={counts.avisos} />

        <div className="side-user" style={{ marginTop: 24 }}>
          <div className="avatar-w">{iniciais(user?.usuarioLogin)}</div>
          <div>
            <strong>{user?.usuarioLogin}</strong>
            <small>
              Síndico(a) · <button onClick={logout}>Sair</button>
            </small>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <nav className="crumbs" aria-label="Você está em">
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: 'contents' }}>
                {i > 0 && <span className="sep">/</span>}
                {c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
              </span>
            ))}
          </nav>
          <div className="top-right">
            <form onSubmit={buscar}>
              <input className="search" type="search" placeholder="Buscar em Moradores..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar moradores" />
            </form>
            <button className="icon-btn" aria-label="Notificações" type="button" onClick={() => nav('/avisos')}>
              🔔
            </button>
            <div className="avatar-n" title={user?.usuarioLogin}>
              {iniciais(user?.usuarioLogin)}
            </div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Portal do morador
export interface PortalCtx {
  moradorId: number;
  nome: string;
  vinculo: Rec | null; // vínculo ativo principal
  imovelId: number | null;
  imovelLabel: string;
  blocoNome: string;
  morador: Rec;
}
const PCtx = createContext<PortalCtx | null>(null);
export const usePortal = () => {
  const c = useContext(PCtx);
  if (!c) throw new Error('usePortal fora do portal');
  return c;
};

export function PortalLayout() {
  const { user, logout } = useAuth();
  const [ctx, setCtx] = useState<PortalCtx | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!user?.moradorId) {
        setErro('Esta conta ainda não está vinculada a um morador. Peça ao síndico para criar o acesso a partir de uma relação.');
        return;
      }
      try {
        const m = await moradorApi.get(user.moradorId);
        const vs: Rec[] = (m.moradorImoveis ?? []).filter((v: Rec) => v.moradorImovelStatus === 1);
        const v = vs.find((x) => !x.moradorImovelDataFim || new Date(x.moradorImovelDataFim) > new Date()) ?? vs[0] ?? null;
        const imovelLabel = v ? imovelRotulo(v.imovel, undefined).replace(/ · .*/, '') : '';
        const blocoNome = v?.imovel?.bloco?.blocoNome ?? '';
        semearPortal(m.moradorId, m.moradorNome, v?.imovelId ?? null, imovelLabel, blocoLetra(blocoNome));
        if (vivo) setCtx({ moradorId: m.moradorId, nome: m.moradorNome, vinculo: v, imovelId: v?.imovelId ?? null, imovelLabel, blocoNome, morador: m });
      } catch (e) {
        if (vivo) setErro((e as Error).message);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [user?.moradorId]);

  const nome = ctx?.nome ?? user?.usuarioLogin ?? '';
  return (
    <div className="portal">
      <header className="portal-top">
        <div className="portal-bar">
          <Link to="/portal" className="brand" style={{ padding: 0 }}>
            <div className="logo">PT</div>
            <strong style={{ color: '#fff' }}>PropTech</strong>
          </Link>
          <nav className="portal-nav" aria-label="Portal do morador">
            <NavLink to="/portal" end>
              Início
            </NavLink>
            <NavLink to="/portal/imovel">Meu Imóvel</NavLink>
            <NavLink to="/portal/cobrancas">Financeiro</NavLink>
            <NavLink to="/portal/reservas">Reservas</NavLink>
            <NavLink to="/portal/ocorrencias">Ocorrências</NavLink>
            <NavLink to="/portal/avisos">Avisos</NavLink>
          </nav>
          <div className="portal-user">
            <div className="avatar-w">{iniciais(nome)}</div>
            <div>
              <strong>{nome}</strong>
              <small>
                <button onClick={logout}>Sair</button>
              </small>
            </div>
          </div>
        </div>
      </header>
      <main className="portal-content">
        {erro ? <ErrorBox>{erro}</ErrorBox> : !ctx ? <Loading /> : <PCtx.Provider value={ctx}><Outlet /></PCtx.Provider>}
      </main>
    </div>
  );
}

// ------------------------------------------------------------------ Guardas
export function RequireRole({ role }: { role: 'SINDICO' | 'MORADOR' }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.usuarioPerfil !== role) return <Navigate to={user.usuarioPerfil === 'SINDICO' ? '/' : '/portal'} replace />;
  return <Outlet />;
}
