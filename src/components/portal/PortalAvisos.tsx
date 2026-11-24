"use client";

import { Card, Empty, PageHeader, RowItem } from "@/components/ui";
import { useT } from "@/i18n";
import { fmtDate } from "@/lib/format";
import { avisosAtivos } from './shared';

export function PortalAvisos() {
  const t = useT();
  const as = avisosAtivos();
  return (
    <>
      <PageHeader title={t("Avisos")} sub={t("Comunicados do síndico para os moradores.")} />
      <Card title="Avisos ativos" count={as.length}>
        {as.length === 0 && <Empty>Nenhum aviso ativo.</Empty>}
        {as.map((a) => (
          <RowItem key={a.id} ico="📢" tint="var(--tint-sky)" title={a.avisos_titulo} sub={`${t("Publicado em {data}", { data: fmtDate(a.avisos_data_publicacao) })}${a.avisos_data_expiracao ? ` · ${t("expira em {data}", { data: fmtDate(a.avisos_data_expiracao) })}` : ""}`} />
        ))}
      </Card>
    </>
  );
}
