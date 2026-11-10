"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, btn, Card, DetailGrid, Empty, ErrorBox, Hero, HeroBadges, KV, Loading, PageHeader, RowItem } from "@/components/ui";
import { usePortal } from "@/components/layouts/PortalShell";
import { competenciaTxt, fmtDate, fmtMoney } from "@/lib/format";
import type { Rec } from "@/models/types";
import { cobrancaApi } from "@/services/financeiroService";
import { imovelRotulo } from "@/services/moradorService";

const comp = (iso: string) => {
  const t = competenciaTxt(iso);
  const meses: Record<string, string> = { Jan: "Janeiro", Fev: "Fevereiro", Mar: "Março", Abr: "Abril", Mai: "Maio", Jun: "Junho", Jul: "Julho", Ago: "Agosto", Set: "Setembro", Out: "Outubro", Nov: "Novembro", Dez: "Dezembro" };
  const [m, a] = t.split("/");
  return `${meses[m!] ?? m}/${a}`;
};

// Só links http(s) viram botão: o link do PDF é digitado pelo síndico.
const linkSeguro = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);

/** imovelId → "Apto 101, Bloco A", a partir das relações do próprio morador (o portal não consulta /imovel). */
function useRotulosDosImoveis(): (id: number) => string {
  const { morador } = usePortal();
  const mapa: Record<number, string> = {};
  for (const v of (morador.moradorImoveis ?? []) as Rec[]) {
    if (!v.imovel) continue;
    const bloco = v.imovel.bloco?.blocoNome;
    mapa[v.imovelId] = `${imovelRotulo(v.imovel, "").replace(/ · .*$/, "")}${bloco ? `, ${bloco}` : ""}`;
  }
  return (id) => mapa[id] ?? `Imóvel #${id}`;
}

export function PortalCobrancas() {
  const p = usePortal();
  const rotulo = useRotulosDosImoveis();
  const [cs, setCs] = useState<Rec[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let vivo = true;
    // a API já devolve só as cobranças dos imóveis do morador logado
    cobrancaApi
      .list({ page: 1, pageSize: 500, filters: { status: 1 } })
      .then((r) => vivo && setCs(r.data))
      .catch((e) => vivo && setErro((e as Error).message));
    return () => {
      vivo = false;
    };
  }, []);

  const varios = new Set((cs ?? []).map((c) => c.imovelId)).size > 1;
  return (
    <>
      <PageHeader title="Minhas Cobranças" sub={`Cobranças do seu imóvel · ${p.imovelLabel || "—"}${p.blocoNome ? `, ${p.blocoNome}` : ""}.`} />
      {erro ? (
        <ErrorBox>{erro}</ErrorBox>
      ) : cs === null ? (
        <Loading />
      ) : (
        <Card title="Cobranças" count={cs.length}>
          {cs.length === 0 && <Empty>Nenhuma cobrança encontrada.</Empty>}
          {cs.map((c) => (
            <RowItem
              key={c.id}
              to={`/portal/cobrancas/${c.id}`}
              ico="🧾"
              tint="#cffafe"
              title={`${comp(c.competencia)} · ${fmtMoney(c.valor)}`}
              sub={`${c.situacao === "PAGO" ? "Pago" : c.situacao === "VENCIDO" ? "Venceu" : "Vence"} em ${fmtDate(c.vencimento)}${varios ? ` · ${rotulo(c.imovelId)}` : ""}`}
              right={<Badge>{c.situacao}</Badge>}
            />
          ))}
        </Card>
      )}
    </>
  );
}

export function PortalCobranca() {
  const rotulo = useRotulosDosImoveis();
  const { id } = useParams<{ id: string }>();
  const [c, setC] = useState<Rec | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let vivo = true;
    cobrancaApi
      .get(id)
      .then((r) => vivo && setC(r))
      .catch((e) => vivo && setErro((e as Error).message));
    return () => {
      vivo = false;
    };
  }, [id]);

  if (erro) return <ErrorBox>{erro}</ErrorBox>;
  if (!c) return <Loading />;
  const pdf = linkSeguro(c.boleto?.urlPdf);
  return (
    <>
      <PageHeader title={`Cobrança · ${comp(c.competencia)}`} sub={rotulo(c.imovelId)} />
      <Hero
        color="navy"
        actions={
          pdf ? (
            <a className={btn("white")} href={pdf} target="_blank" rel="noopener noreferrer">
              Baixar boleto (PDF)
            </a>
          ) : undefined
        }
      >
        <small className="text-[10.5px] font-bold tracking-[0.04em] opacity-85">COBRANÇA</small>
        <h2 className="mt-1 mb-2.5 text-[22px] font-extrabold">{fmtMoney(c.valor)}</h2>
        <HeroBadges items={[c.situacao]} />
      </Hero>
      <DetailGrid>
        <Card title="Dados da cobrança">
          {[
            ["Descrição", c.descricao ?? "—"],
            ["Competência", fmtDate(c.competencia)],
            ["Vencimento", fmtDate(c.vencimento)],
            ["Situação", c.situacao],
          ].map(([k, v]) => (
            <KV k={k} key={k}>
              {v}
            </KV>
          ))}
        </Card>
        <Card title="Boleto">
          {c.boleto && c.boleto.status !== 0 ? (
            <>
              <KV k="Linha digitável">{c.boleto.linhaDigitavel ?? "—"}</KV>
              <KV k="Código de barras">{c.boleto.codigoBarras ?? "—"}</KV>
              <KV k="Cadastro do boleto">{fmtDate(c.boleto.dataEmissao)}</KV>
            </>
          ) : (
            <Empty>O boleto desta cobrança ainda não foi cadastrado.</Empty>
          )}
        </Card>
      </DetailGrid>
    </>
  );
}
