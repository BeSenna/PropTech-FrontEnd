"use client";

import Link from "next/link";
import { Badge, btn, Card, DetailGrid, Empty, PageHeader, RowItem, StatCard, StatGrid } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { usePortal } from "@/components/layouts/PortalShell";
import { gruposDeImoveis } from "@/lib/relacao";
import { horario, primeiroNome, minhasReservas, minhasOcorrencias, avisosAtivos } from './shared';

export function PortalHome() {
  const p = usePortal();
  const reservas = minhasReservas(p.moradorId).filter((r) => r.reserva_status === 1);
  const ocs = minhasOcorrencias(p.moradorId).filter((o) => o.ocorrencia_tipo === "EM_ANDAMENTO");
  const avisos = avisosAtivos();
  const nImoveis = gruposDeImoveis(p.vinculos).length;
  const subImovel = !p.imovelLabel ? "Sem imóvel vinculado" : `${p.imovelLabel} · ${p.blocoNome}${nImoveis > 1 ? ` e mais ${nImoveis - 1} ${nImoveis - 1 === 1 ? "imóvel" : "imóveis"}` : ""}`;
  return (
    <>
      <PageHeader
        back={false}
        title={`Olá, ${primeiroNome(p.nome)} 👋`}
        sub={`${subImovel} — bem-vindo(a) ao seu portal.`}
        actions={
          <>
            <Link className={btn("outline")} href="/portal/reservas/nova">
              + Nova reserva
            </Link>
            <Link className={btn("amber")} href="/portal/ocorrencias/nova">
              + Abrir ocorrência
            </Link>
          </>
        }
      />
      <StatGrid>
        <StatCard value={nImoveis} label={nImoveis > 1 ? "Imóveis vinculados" : "Imóvel vinculado"} color="navy" />
        <StatCard value={reservas.length} label="Reservas ativas" color="green" className="border-l-[#7c3aed]!" />
        <StatCard value={ocs.length} label="Ocorrência em andamento" color="amber" className="border-l-[#ea580c]!" />
        <StatCard value={avisos.length} label="Avisos ativos" color="pink" className="border-l-[#0284c7]!" />
      </StatGrid>
      <DetailGrid even>
        <Card title="Minhas próximas reservas">
          {reservas.length === 0 && <Empty>Nenhuma reserva ativa.</Empty>}
          {reservas.slice(0, 4).map((r) => (
            <RowItem key={r.id} ico="📅" tint="var(--tint-violet)" title={r.area_comum_label} sub={`${fmtDate(r.reserva_data_reserva)} · ${horario(r)}`} right={<Badge>{r.reserva_tipo}</Badge>} />
          ))}
        </Card>
        <Card title="Avisos recentes">
          {avisos.length === 0 && <Empty>Nenhum aviso.</Empty>}
          {avisos.slice(0, 4).map((a) => (
            <RowItem key={a.id} ico="📢" tint="var(--tint-sky)" title={a.avisos_titulo} sub={fmtDate(a.avisos_data_publicacao)} />
          ))}
        </Card>
      </DetailGrid>
    </>
  );
}
