"use client";

import { useEffect, useState } from "react";
import { ErrorBox, MockTag, ModuleCard, ModuleGrid, PageHeader, SectionLabel, StatCard, StatGrid } from "@/components/ui";
import { fmtMoney } from "@/lib/format";
import { useStatsMoradores } from "@/hooks/useStatsMoradores";
import { areaStore, avisoStore, ocorrenciaStore, reservaStore } from "@/mock/data";
import { resumoFinanceiro, type ResumoFinanceiro } from "@/services/financeiroService";

const CAD_MODULES = (
  <ModuleGrid>
    <ModuleCard icon="🏢" title="Blocos" desc="Nome, descrição, status" to="/blocos" tint="var(--tint-blue)" />
    <ModuleCard icon="🏠" title="Imóveis" desc="Tipo, matrícula, IPTU" to="/imoveis" tint="var(--tint-green)" />
    <ModuleCard icon="👤" title="Moradores" desc="Dados pessoais e contato" to="/moradores" tint="var(--tint-amber)" />
    <ModuleCard icon="🔗" title="Relação" desc="Tipo, vigência" to="/vinculos" tint="var(--tint-pink)" />
  </ModuleGrid>
);

function StatsMoradores() {
  const { s, erro } = useStatsMoradores();
  return (
    <>
      {erro && <ErrorBox>{erro}</ErrorBox>}
      <StatGrid>
        <StatCard value={s?.[0] ?? "—"} label="Blocos cadastrados" color="navy" to="/blocos" />
        <StatCard value={s?.[1] ?? "—"} label="Imóveis ativos" color="green" to="/imoveis?status=1" />
        <StatCard value={s?.[2] ?? "—"} label="Moradores ativos" color="amber" to="/moradores?status=1" />
        <StatCard value={s?.[3] ?? "—"} label="Vínculos registrados" color="pink" to="/vinculos" />
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
        <ModuleCard icon="🧾" title="Cobranças" desc="Competência, valor, vencimento, boleto" to="/cobrancas" tint="var(--tint-cyan)" />
        <ModuleCard icon="💸" title="Despesas" desc="Fornecedor, valor, categoria" to="/despesas" tint="var(--tint-red)" />
        <ModuleCard icon="💰" title="Receitas" desc="Valor, categoria" to="/receitas" tint="var(--tint-green)" />
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
  const [r, setR] = useState<ResumoFinanceiro | null>(null);
  const [erro, setErro] = useState("");
  useEffect(() => {
    let vivo = true;
    resumoFinanceiro()
      .then((x) => vivo && setR(x))
      .catch((e) => vivo && setErro((e as Error).message));
    return () => {
      vivo = false;
    };
  }, []);
  const v = (n?: number) => (n === undefined ? "—" : fmtMoney(n));
  return (
    <>
      <PageHeader title="Financeiro" sub="Visão geral financeira do condomínio Jardim das Palmeiras." />
      {erro && <ErrorBox>{erro}</ErrorBox>}
      {r?.parcial && <ErrorBox>Há mais de 500 registros em algum total; os valores abaixo consideram só os 500 mais recentes de cada tipo.</ErrorBox>}
      <StatGrid>
        <StatCard value={v(r?.pendentes)} label="Cobranças em aberto" color="navy" />
        <StatCard value={v(r?.recebido)} label="Recebido (confirmado)" color="green" />
        <StatCard value={v(r?.despesas)} label="Despesas ativas" color="amber" />
        <StatCard value={v(r?.receitas)} label="Receitas extras" color="pink" />
      </StatGrid>
      <SectionLabel>Módulos</SectionLabel>
      <ModuleGrid>
        <ModuleCard icon="🧾" title="Cobranças" desc="Valor, vencimento" to="/cobrancas" tint="var(--tint-cyan)" />
        <ModuleCard icon="🏷️" title="Boletos" desc="Linha digitável, PDF" to="/boletos" tint="var(--tint-amber)" />
        <ModuleCard icon="💳" title="Pagamentos" desc="Forma, valor pago" to="/pagamentos" tint="var(--tint-violet)" />
        <ModuleCard icon="📤" title="Despesas" desc="Fornecedor, categoria" to="/despesas" tint="var(--tint-red)" />
        <ModuleCard icon="📥" title="Receitas" desc="Categoria, valor" to="/receitas" tint="var(--tint-green)" />
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
        <ModuleCard icon="🏊" title="Áreas Comuns" desc="Nome, capacidade" to="/areas-comuns" tint="var(--tint-cyan)" />
        <ModuleCard icon="⚠️" title="Ocorrências" desc="Título, tipo, morador" to="/ocorrencias" tint="var(--tint-amber)" />
        <ModuleCard icon="📢" title="Avisos" desc="Título, publicação, expiração" to="/avisos" tint="var(--tint-pink)" />
      </ModuleGrid>
    </>
  );
}
