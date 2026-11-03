"use client";

import { useParams } from "next/navigation";
import { Badge, btn, Card, DetailGrid, Empty, ErrorBox, Hero, HeroBadges, KV, PageHeader, RowItem } from "@/components/ui";
import { competenciaTxt, fmtDate, fmtMoney } from "@/lib/format";
import { cobrancaStore } from "@/mock/data";
import { usePortal } from "@/components/layouts/PortalShell";

const minhasCobrancas = (imovelId: number | null) => (imovelId ? cobrancaStore.all().filter((c) => c.imovel_id === imovelId && c.cobranca_status === 1) : []);
const comp = (iso: string) => {
  const t = competenciaTxt(iso);
  const meses: Record<string, string> = { Jan: "Janeiro", Fev: "Fevereiro", Mar: "Março", Abr: "Abril", Mai: "Maio", Jun: "Junho", Jul: "Julho", Ago: "Agosto", Set: "Setembro", Out: "Outubro", Nov: "Novembro", Dez: "Dezembro" };
  const [m, a] = t.split("/");
  return `${meses[m!] ?? m}/${a}`;
};

export function PortalCobrancas() {
  const p = usePortal();
  const cs = minhasCobrancas(p.imovelId);
  return (
    <>
      <PageHeader title="Minhas Cobranças" sub={`Cobranças do seu imóvel · ${p.imovelLabel || "—"}${p.blocoNome ? `, ${p.blocoNome}` : ""}.`} />
      <Card title="Cobranças" count={cs.length}>
        {cs.length === 0 && <Empty>Nenhuma cobrança encontrada.</Empty>}
        {cs.map((c) => (
          <RowItem
            key={c.id}
            to={`/portal/cobrancas/${c.id}`}
            ico="🧾"
            tint="#cffafe"
            title={`${comp(c.cobranca_competencia)} · ${fmtMoney(c.cobranca_valor)}`}
            sub={`${c.cobranca_tipo === "PAGO" ? "Pago" : c.cobranca_tipo === "VENCIDO" ? "Venceu" : "Vence"} em ${fmtDate(c.cobranca_vencimento)}`}
            right={<Badge>{c.cobranca_tipo}</Badge>}
          />
        ))}
      </Card>
    </>
  );
}

export function PortalCobranca() {
  const p = usePortal();
  const { id } = useParams<{ id: string }>();
  const c = minhasCobrancas(p.imovelId).find((x) => String(x.id) === id);
  if (!c) return <ErrorBox>Cobrança não encontrada.</ErrorBox>;
  return (
    <>
      <PageHeader title={`Cobrança · ${comp(c.cobranca_competencia)}`} sub={`${p.imovelLabel} · ${p.blocoNome}`} />
      <Hero
        color="navy"
        actions={
          <button type="button" className={btn("white")} onClick={() => window.print()}>
            Baixar boleto (PDF)
          </button>
        }
      >
        <small className="text-[10.5px] font-bold tracking-[0.04em] opacity-85">COBRANÇA</small>
        <h2 className="mt-1 mb-2.5 text-[22px] font-extrabold">{fmtMoney(c.cobranca_valor)}</h2>
        <HeroBadges items={[c.cobranca_tipo]} />
      </Hero>
      <DetailGrid>
        <Card title="Dados da cobrança">
          {[
            ["Descrição", c.cobranca_descricao],
            ["Competência", fmtDate(c.cobranca_competencia)],
            ["Vencimento", fmtDate(c.cobranca_vencimento)],
            ["Situação", c.cobranca_tipo],
          ].map(([k, v]) => (
            <KV k={k} key={k}>
              {v}
            </KV>
          ))}
        </Card>
        <Card title="Boleto">
          <KV k="Linha digitável">{c.boleto_linha_digitavel}</KV>
          <KV k="Emissão do boleto">{fmtDate(c.boleto_data_emissao)}</KV>
        </Card>
      </DetailGrid>
    </>
  );
}
