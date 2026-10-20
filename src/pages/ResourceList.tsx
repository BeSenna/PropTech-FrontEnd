import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Empty, ErrorBox, Loading, PageHeader } from '../components/ui';
import type { Option, Rec, ResourceConfig } from '../lib/types';

const PAGE_SIZE = 10;
type Filters = Record<string, string | number | undefined>;

export default function ResourceList({ cfg }: { cfg: ResourceConfig }) {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [chip, setChip] = useState(0);
  const [busca, setBusca] = useState(() => sp.get('busca') ?? '');
  const [buscaAtiva, setBuscaAtiva] = useState(() => (sp.get('busca') ?? '').trim());
  const [page, setPage] = useState(1);
  const [selects, setSelects] = useState<Record<string, string>>({});
  const [selOpts, setSelOpts] = useState<Record<string, Option[]>>({});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [rows, setRows] = useState<Rec[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const chips = cfg.chips ?? [{ label: 'Todos', filters: {} }];
  const local = !!cfg.localFilterKeys?.length;

  // filtros vindos da URL (?blocoId=1) e dos selects da barra
  const baseFilters = useMemo<Filters>(() => {
    const f: Filters = { ...(cfg.extraFilters ?? {}) };
    for (const k of cfg.urlFilters ?? []) {
      const v = sp.get(k);
      if (v) f[k] = v;
    }
    for (const [k, v] of Object.entries(selects)) if (v) f[k] = v;
    return f;
  }, [cfg, sp, selects]);

  useEffect(() => {
    const t = setTimeout(() => {
      setBuscaAtiva(busca.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    setChip(0);
    setPage(1);
    setSelects({});
    setSort(null);
  }, [cfg.key]);

  useEffect(() => {
    let vivo = true;
    cfg.selectFilters?.forEach(async (s) => {
      try {
        const o = await s.load();
        if (vivo) setSelOpts((x) => ({ ...x, [s.param]: o }));
      } catch {
        /* o select fica vazio */
      }
    });
    return () => {
      vivo = false;
    };
  }, [cfg]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const ativo = chips[chip]?.filters ?? {};
      if (local) {
        // a API não filtra por esses campos: busca tudo, enriquece e filtra no navegador
        const apiOnly: Filters = { ...baseFilters };
        for (const [k, v] of Object.entries(ativo)) if (!cfg.localFilterKeys!.includes(k)) apiOnly[k] = v;
        const r = await cfg.adapter.list({ page: 1, pageSize: 500, busca: buscaAtiva || undefined, filters: apiOnly });
        const todos = cfg.enrich ? await cfg.enrich(r.data) : r.data;
        const passa = (row: Rec, f: Filters) => Object.entries(f).every(([k, v]) => v === undefined || !cfg.localFilterKeys!.includes(k) || cfg.localFilter!(row, k, v));
        const filtrados = todos.filter((row) => passa(row, ativo));
        setCounts(chips.map((c) => todos.filter((row) => passa(row, c.filters)).length));
        setTotal(filtrados.length);
        setRows(filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
      } else {
        const r = await cfg.adapter.list({ page, pageSize: PAGE_SIZE, busca: buscaAtiva || undefined, filters: { ...baseFilters, ...ativo } });
        setTotal(r.total);
        setRows(cfg.enrich ? await cfg.enrich(r.data) : r.data);
        if (chips.length > 1) {
          const cs = await Promise.all(chips.map((c) => cfg.adapter.list({ page: 1, pageSize: 1, busca: buscaAtiva || undefined, filters: { ...baseFilters, ...c.filters } }).then((x) => x.total)));
          setCounts(cs);
        }
      }
    } catch (e) {
      setErro((e as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, chip, page, buscaAtiva, baseFilters, local]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const ordenadas = useMemo(() => {
    if (!sort) return rows;
    const col = cfg.columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const x = col.sortValue!(a);
      const y = col.sortValue!(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [rows, sort, cfg]);

  const paginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const novo = cfg.newLabel ?? `${cfg.gender === 'm' ? 'Novo' : 'Nova'} ${cfg.singular}`;
  const abrir = (r: Rec) => nav(`${cfg.path}/${r[cfg.idKey]}${cfg.hasDetail ? '' : '/editar'}`);
  const pageNumbers = Array.from({ length: paginas }, (_, i) => i + 1).filter((n) => n === 1 || n === paginas || Math.abs(n - page) <= 1);

  return (
    <>
      <PageHeader
        title={cfg.plural}
        sub={
          <>
            {cfg.endpoint} — {total} registro{total === 1 ? '' : 's'}
            {cfg.mockTag && <span className="mock-tag">DADOS SIMULADOS</span>}
            {cfg.listSub && <span className="mock-tag" style={{ background: 'var(--blue-bg)', color: 'var(--primary)' }}>{cfg.listSub}</span>}
          </>
        }
        actions={
          <Link to={`${cfg.path}/novo`} className="btn btn-primary">
            + {novo}
          </Link>
        }
      />

      <div className="toolbar">
        {cfg.searchable && (
          <input className="search" type="search" placeholder={cfg.searchPlaceholder ?? 'Buscar...'} value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar" />
        )}
        {cfg.selectFilters?.map((s) => (
          <select
            key={s.param}
            className="input"
            style={{ width: 'auto', minWidth: 160 }}
            aria-label={s.label}
            value={selects[s.param] ?? sp.get(s.param) ?? ''}
            onChange={(e) => {
              setSelects((x) => ({ ...x, [s.param]: e.target.value }));
              setPage(1);
            }}
          >
            <option value="">{s.label}: todos</option>
            {(selOpts[s.param] ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        {chips.length > 1 &&
          chips.map((c, i) => (
            <button
              key={c.label}
              type="button"
              className={`chip ${i === chip ? 'on' : ''}`}
              onClick={() => {
                setChip(i);
                setPage(1);
              }}
            >
              {c.label}
              {counts[i] !== undefined ? ` (${counts[i]})` : ''}
            </button>
          ))}
      </div>

      {erro && <ErrorBox>{erro}</ErrorBox>}
      <Card>
        {loading && rows.length === 0 ? (
          <Loading />
        ) : rows.length === 0 && !erro ? (
          <Empty>Nenhum registro encontrado.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="t">
              <thead>
                <tr>
                  {cfg.columns.map((c) => (
                    <th
                      key={c.key}
                      className={c.sortValue ? 'sortable' : ''}
                      onClick={() => c.sortValue && setSort((s) => (s?.key === c.key ? { key: c.key, dir: (s.dir * -1) as 1 | -1 } : { key: c.key, dir: 1 }))}
                    >
                      {c.label}
                      {c.sortValue && <span className="arrow">{sort?.key === c.key ? (sort.dir === 1 ? '↑' : '↓') : '⇅'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenadas.map((r) => (
                  <tr
                    key={r[cfg.idKey]}
                    tabIndex={0}
                    onClick={() => abrir(r)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') abrir(r);
                    }}
                  >
                    {cfg.columns.map((c) => (
                      <td key={c.key} className={c.strong ? 'strong' : ''}>
                        {c.render ? c.render(r) : (r[c.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="t-foot">
          <span>
            Exibindo {rows.length} de {total}
          </span>
          <div className="pager">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Página anterior">
              ‹
            </button>
            {pageNumbers.map((n, i) => (
              <span key={n} style={{ display: 'contents' }}>
                {i > 0 && n - pageNumbers[i - 1]! > 1 && <span>…</span>}
                <button type="button" className={n === page ? 'on' : ''} onClick={() => setPage(n)}>
                  {n}
                </button>
              </span>
            ))}
            <button type="button" disabled={page >= paginas} onClick={() => setPage(page + 1)} aria-label="Próxima página">
              ›
            </button>
          </div>
        </div>
      </Card>
    </>
  );
}
