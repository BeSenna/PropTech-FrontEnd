"use client";

import { useEffect, useState } from "react";
import { ErrorBox, MockTag, ModuleCard, ModuleGrid, PageHeader, SectionLabel, StatCard, StatGrid } from "@/components/ui";
import { fmtMoney } from "@/lib/format";
import { totalDe } from "@/resources/api";
import { areaStore, avisoStore, cobrancaStore, despesaStore, ocorrenciaStore, pagamentoStore, receitaStore, reservaStore } from "@/mock/data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const soma = (xs: { [k: string]: any }[], k: string) => xs.reduce((s, r) => s + Number(r[k] || 0), 0);

function useStatsMoradores() {
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

const CAD_MODULES = (
  <ModuleGrid>
    <ModuleCard icon="🏢" title="Blocos" desc="bloco — nome, descrição, status" to="/blocos" tint="#eef2fb" />
    <ModuleCard icon="🏠" title="Imóveis" desc="imovel — tipo, matrícula, IPTU" to="/imoveis" tint="#d1fae5" />
    <ModuleCard icon="👤" title="Moradores" desc="morador — dados pessoais e contato" to="/moradores" tint="#fef3c7" />
    <ModuleCard icon="🔗" title="Relação" desc="morador_imovel — tipo, vigência" to="/vinculos" tint="#fce7f3" />
  </ModuleGrid>
);

function StatsMoradores() {
  const { s, erro } = useStatsMoradores();
  return (
    <>
      {erro && <ErrorBox>{erro}</ErrorBox>}
      <StatGrid>
        <StatCard value={s?.[0] ?? "—"} label="Blocos cadastrados" color="navy" />
        <StatCard value={s?.[1] ?? "—"} label="Imóveis ativos" color="green" />
        <StatCard value={s?.[2] ?? "—"} label="Moradores ativos" color="amber" />
        <StatCard value={s?.[3] ?? "—"} label="Vínculos registrados" color="pink" />
      </StatGrid>
    </>
  );
}

export function Dashboard() {
  return (
    <>
      <PageHeader title="Dashboard — Módulo Moradores" sub="Visão geral do condomínio Jardim das Palmeiras." back={false} />
      <StatsMoradores />
      <SectionLabel>Módulos</SectionLabel>
      {CAD_MODULES}
      <SectionLabel>Financeiro</SectionLabel>
      <ModuleGrid three>
        <ModuleCard icon="🧾" title="Cobranças" desc="cobranca — competência, valor, vencimento, boleto" to="/cobrancas" tint="#cffafe" />
        <ModuleCard icon="💸" title="Despesas" desc="despesa — fornecedor, valor, categoria" to="/despesas" tint="#fee2e2" />
        <ModuleCard icon="💰" title="Receitas" desc="receita — valor, categoria" to="/receitas" tint="#d1fae5" />
      </ModuleGrid>
    </>
  );
}

export function CadastrosOverview() {
  return (
    <>
      <PageHeader title="Cadastros" sub="Visão geral dos cadastros do condomínio Jardim das Palmeiras." />
      <StatsMoradores />
      <SectionLabel>Módulos</SectionLabel>
      {CAD_MODULES}
    </>
  );
}

export function FinanceiroOverview() {
  const cob = cobrancaStore.all().filter((c) => c.cobranca_status === 1);
  const pendentes = soma(cob.filter((c) => c.cobranca_tipo === "PENDENTE" || c.cobranca_tipo === "VENCIDO"), "cobranca_valor");
  const recebido = soma(pagamentoStore.all().filter((p) => p.pagamento_status === 1), "pagamento_valor_pago");
  const despesas = soma(despesaStore.all().filter((d) => d.despesa_status === 1), "despesa_valor");
  const receitas = soma(receitaStore.all().filter((r) => r.receita_status === 1), "receita_valor");
  return (
    <>
      <PageHeader
        title="Financeiro"
        sub={
          <>
            Visão geral financeira do condomínio Jardim das Palmeiras.
            <MockTag />
          </>
        }
      />
      <StatGrid>
        <StatCard value={fmtMoney(pendentes)} label="Cobranças pendentes" color="navy" />
        <StatCard value={fmtMoney(recebido)} label="Recebido (confirmado)" color="green" />
        <StatCard value={fmtMoney(despesas)} label="Despesas ativas" color="amber" />
        <StatCard value={fmtMoney(receitas)} label="Receitas extras" color="pink" />
      </StatGrid>
      <SectionLabel>Módulos</SectionLabel>
      <ModuleGrid>
        <ModuleCard icon="🧾" title="Cobranças" desc="cobranca — valor, vencimento" to="/cobrancas" tint="#cffafe" />
        <ModuleCard icon="💳" title="Pagamentos" desc="pagamento — forma, valor pago" to="/pagamentos" tint="#ede9fe" />
        <ModuleCard icon="📤" title="Despesas" desc="despesa — fornecedor, categoria" to="/despesas" tint="#fee2e2" />
        <ModuleCard icon="📥" title="Receitas" desc="receita — categoria, valor" to="/receitas" tint="#d1fae5" />
      </ModuleGrid>
    </>
  );
}

export function ServicosOverview() {
  return (
    <>
      <PageHeader
        title="Serviços"
        sub={
          <>
            Áreas comuns, reservas, ocorrências e avisos do condomínio.
            <MockTag />
          </>
        }
      />
      <StatGrid>
        <StatCard value={areaStore.all().filter((a) => a.area_comum_status === 1).length} label="Áreas comuns" color="navy" />
        <StatCard value={reservaStore.all().filter((r) => r.reserva_status === 1).length} label="Reservas ativas" color="green" />
        <StatCard value={ocorrenciaStore.all().filter((o) => o.ocorrencia_status === 1 && o.ocorrencia_tipo !== "FINALIZADA").length} label="Ocorrências abertas" color="amber" />
        <StatCard value={avisoStore.all().filter((a) => a.avisos_status === 1).length} label="Avisos ativos" color="pink" />
      </StatGrid>
      <SectionLabel>Módulos</SectionLabel>
      <ModuleGrid three>
        <ModuleCard icon="🏊" title="Áreas Comuns" desc="area_comum — nome, capacidade" to="/areas-comuns" tint="#cffafe" />
        <ModuleCard icon="⚠️" title="Ocorrências" desc="ocorrencia — título, tipo, morador" to="/ocorrencias" tint="#fef3c7" />
        <ModuleCard icon="📢" title="Avisos" desc="avisos — título, publicação, expiração" to="/avisos" tint="#fce7f3" />
      </ModuleGrid>
    </>
  );
}
