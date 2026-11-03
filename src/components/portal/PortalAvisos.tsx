"use client";

import { Card, Empty, PageHeader, RowItem } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { avisosAtivos } from './shared';

export function PortalAvisos() {
  const as = avisosAtivos();
  return (
    <>
      <PageHeader title="Avisos" sub="Comunicados do síndico para os moradores." />
      <Card title="Avisos ativos" count={as.length}>
        {as.length === 0 && <Empty>Nenhum aviso ativo.</Empty>}
        {as.map((a) => (
          <RowItem key={a.id} ico="📢" tint="#e0f2fe" title={a.avisos_titulo} sub={`Publicado em ${fmtDate(a.avisos_data_publicacao)}${a.avisos_data_expiracao ? ` · expira em ${fmtDate(a.avisos_data_expiracao)}` : ""}`} />
        ))}
      </Card>
    </>
  );
}
