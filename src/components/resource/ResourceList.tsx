"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { btn, Card, cx, Empty, ErrorBox, inputAutoCls, Loading, MockTag, PageHeader, searchCls } from "@/components/ui";
import type { Option, Rec, ResourceConfig } from "@/models/types";

const PAGE_SIZE = 10;
type Filters = Record<string, string | number | undefined>;

// celular/tablet: a 1ª coluna (quem é o registro) fica fixa enquanto a tabela rola para o lado
const PRIMEIRA_COL_TH = "max-[819px]:sticky max-[819px]:left-0 max-[819px]:z-[1] max-[819px]:bg-surface max-[819px]:border-r max-[819px]:border-line-soft";
const PRIMEIRA_COL_TD = "max-[819px]:sticky max-[819px]:left-0 max-[819px]:z-[1] max-[819px]:bg-surface max-[819px]:border-r max-[819px]:border-line-soft max-[819px]:min-w-32 max-[819px]:max-w-40 group-hover:max-[819px]:bg-subtle";

export default function ResourceList({ cfg }: { cfg: ResourceConfig }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [chip, setChip] = useState(0);
  // a tabela é mais larga que a tela? (mostra o aviso de rolagem no celular/tablet)
  const tabelaRef = useRef<HTMLDivElement>(null);
  const [rola, setRola] = useState(false);
  const [busca, setBusca] = useState(() => sp.get("busca") ?? "");
  const [buscaAtiva, setBuscaAtiva] = useState(() => (sp.get("busca") ?? "").trim());
  const [page, setPage] = useState(1);
  const [selects, setSelects] = useState<Record<string, string>>({});
  const [selOpts, setSelOpts] = useState<Record<string, Option[]>>({});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [rows, setRows] = useState<Rec[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const chips = useMemo(() => cfg.chips ?? [{ label: "Todos", filters: {} }], [cfg]);
  const local = !!cfg.localFilterKeys?.length;
  const buscaUrl = sp.get("busca");

  // a busca do topo (?busca=) chega pela URL, inclusive quando já estamos na lista
  useEffect(() => {
    setBusca(buscaUrl ?? "");
  }, [buscaUrl]);

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

  // Cada consulta recebe um número. Se outra começar antes desta terminar (busca digitada, troca de página),
  // a resposta antiga é descartada e não sobrescreve a mais nova (mesma ideia do "consultaCancelada" da apostila).
  const consulta = useRef(0);
  useEffect(() => {
    const atual = consulta;
    return () => {
      atual.current++; // ao sair da tela, descarta qualquer resposta pendente
    };
  }, []);

  const carregar = useCallback(async () => {
    const minha = ++consulta.current;
    const valida = () => minha === consulta.current;
    setLoading(true);
    setErro("");
    try {
      const ativo = chips[chip]?.filters ?? {};
      if (local) {
        // a API não filtra por esses campos: busca tudo, enriquece e filtra no navegador
        const apiOnly: Filters = { ...baseFilters };
        for (const [k, v] of Object.entries(ativo)) if (!cfg.localFilterKeys!.includes(k)) apiOnly[k] = v;
        const r = await cfg.adapter.list({ page: 1, pageSize: 500, busca: buscaAtiva || undefined, filters: apiOnly });
        const todos = cfg.enrich ? await cfg.enrich(r.data) : r.data;
        if (!valida()) return;
        const passa = (row: Rec, f: Filters) => Object.entries(f).every(([k, v]) => v === undefined || !cfg.localFilterKeys!.includes(k) || cfg.localFilter!(row, k, v));
        const filtrados = todos.filter((row) => passa(row, ativo));
        setCounts(chips.map((c) => todos.filter((row) => passa(row, c.filters)).length));
        setTotal(filtrados.length);
        setRows(filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
      } else {
        const r = await cfg.adapter.list({ page, pageSize: PAGE_SIZE, busca: buscaAtiva || undefined, filters: { ...baseFilters, ...ativo } });
        const dados = cfg.enrich ? await cfg.enrich(r.data) : r.data;
        if (!valida()) return;
        setTotal(r.total);
        setRows(dados);
        if (chips.length > 1) {
          const cs = await Promise.all(chips.map((c) => cfg.adapter.list({ page: 1, pageSize: 1, busca: buscaAtiva || undefined, filters: { ...baseFilters, ...c.filters } }).then((x) => x.total)));
          if (!valida()) return;
          setCounts(cs);
        }
      }
    } catch (e) {
      if (!valida()) return;
      setErro((e as Error).message);
      setRows([]);
    } finally {
      if (valida()) setLoading(false);
    }
  }, [cfg, chips, chip, page, buscaAtiva, baseFilters, local]);

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

  // mede se a tabela passa da largura do cartão (no giro do aparelho ou ao carregar novos dados)
  useEffect(() => {
    const el = tabelaRef.current;
    if (!el) {
      setRola(false);
      return;
    }
    const medir = () => setRola(el.scrollWidth > el.clientWidth + 1);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [ordenadas]);

  const paginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const novo = cfg.newLabel ?? `${cfg.gender === "m" ? "Novo" : "Nova"} ${cfg.singular}`;
  const abrir = (r: Rec) => router.push(`${cfg.path}/${r[cfg.idKey]}${cfg.hasDetail ? "" : "/editar"}`);
  const pageNumbers = Array.from({ length: paginas }, (_, i) => i + 1).filter((n) => n === 1 || n === paginas || Math.abs(n - page) <= 1);
  const pagBtn = "h-10 min-w-10 rounded-[7px] border text-[11.5px] font-semibold disabled:cursor-default disabled:opacity-40 min-[820px]:h-7 min-[820px]:min-w-7";

  return (
    <>
      <PageHeader
        title={cfg.plural}
        sub={
          <>
            {total} registro{total === 1 ? "" : "s"}
            {cfg.mockTag && <MockTag />}
            {cfg.listSub && <MockTag blue>{cfg.listSub}</MockTag>}
          </>
        }
        actions={
          <Link href={`${cfg.path}/novo`} className={btn("primary")}>
            + {novo}
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        {cfg.searchable && (
          <input className={cx(searchCls, "w-[280px] max-w-full bg-surface!")} type="search" placeholder={cfg.searchPlaceholder ?? "Buscar..."} value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar" />
        )}
        {cfg.selectFilters?.map((s) => (
          <select
            key={s.param}
            className={inputAutoCls}
            aria-label={s.label}
            value={selects[s.param] ?? sp.get(s.param) ?? ""}
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
              className={cx("rounded-full border px-3.5 py-1.5 text-xs font-bold max-[819px]:min-h-10", i === chip ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink-2")}
              onClick={() => {
                setChip(i);
                setPage(1);
              }}
            >
              {c.label}
              {counts[i] !== undefined ? ` (${counts[i]})` : ""}
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
          <div ref={tabelaRef} className="overflow-x-auto">
            <table className="w-full border-collapse">
              <caption className="sr-only">Lista de {cfg.plural.toLowerCase()}</caption>
              <thead>
                <tr>
                  {cfg.columns.map((c, ci) => (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={c.sortValue && sort?.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
                      className={cx("border-b border-line px-3 py-3.5 text-left text-[10.5px] font-bold tracking-[0.03em] whitespace-nowrap text-muted uppercase select-none min-[820px]:px-[18px]", c.sortValue && "cursor-pointer", ci === 0 && PRIMEIRA_COL_TH)}
                      onClick={() => c.sortValue && setSort((s) => (s?.key === c.key ? { key: c.key, dir: (s.dir * -1) as 1 | -1 } : { key: c.key, dir: 1 }))}
                    >
                      {c.label}
                      {c.sortValue && <span className="ml-1 text-muted-2">{sort?.key === c.key ? (sort.dir === 1 ? "↑" : "↓") : "⇅"}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenadas.map((r) => (
                  <tr
                    key={r[cfg.idKey]}
                    tabIndex={0}
                    className="group cursor-pointer hover:bg-subtle"
                    onClick={() => abrir(r)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") abrir(r);
                    }}
                  >
                    {cfg.columns.map((c, ci) => (
                      <td key={c.key} className={cx("border-b border-line-soft px-3 py-[13px] align-middle min-[820px]:px-[18px]", c.strong && "font-bold", ci === 0 && PRIMEIRA_COL_TD)}>
                        {c.render ? c.render(r) : (r[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rola && (
          <p className="m-0 border-t border-line-soft px-3 py-2 text-center text-[11px] text-muted min-[820px]:hidden" aria-hidden="true">
            ← Deslize a tabela para ver as outras colunas →
          </p>
        )}
        <div className="flex items-center justify-between px-3 py-3 text-[11.5px] text-muted min-[820px]:px-[18px]">
          <span>
            Exibindo {rows.length} de {total}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" className={`${pagBtn} border-line bg-surface`} disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Página anterior">
              ‹
            </button>
            {pageNumbers.map((n, i) => (
              <span key={n} className="contents">
                {i > 0 && n - pageNumbers[i - 1]! > 1 && <span>…</span>}
                <button type="button" className={cx(pagBtn, n === page ? "border-primary bg-primary text-white" : "border-line bg-surface")} onClick={() => setPage(n)}>
                  {n}
                </button>
              </span>
            ))}
            <button type="button" className={`${pagBtn} border-line bg-surface`} disabled={page >= paginas} onClick={() => setPage(page + 1)} aria-label="Próxima página">
              ›
            </button>
          </div>
        </div>
      </Card>
    </>
  );
}
