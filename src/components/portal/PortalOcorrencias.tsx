"use client";

import Link from "next/link";
import { useT } from "@/i18n";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Badge, btn, Card, Empty, inputCls, PageHeader, RowItem } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { fmtDate } from "@/lib/format";
import { ocorrenciaStore } from "@/mock/data";
import { usePortal } from "@/components/layouts/PortalShell";
import { agora, minhasOcorrencias, Campo, FormCard } from './shared';

export function PortalOcorrencias() {
  const p = usePortal();
  const t = useT();
  const os = minhasOcorrencias(p.moradorId);
  return (
    <>
      <PageHeader
        title={t("Minhas Ocorrências")}
        sub={t("Problemas que você reportou.")}
        actions={
          <Link className={btn("amber")} href="/portal/ocorrencias/nova">
            {t("+ Abrir ocorrência")}
          </Link>
        }
      />
      <Card title="Ocorrências" count={os.length}>
        {os.length === 0 && <Empty>Você ainda não abriu ocorrências.</Empty>}
        {os.map((o) => (
          <RowItem key={o.id} ico="⚠️" tint="var(--tint-amber)" title={o.ocorrencia_titulo} sub={fmtDate(o.ocorrencia_data_ocorrencia)} right={<Badge>{o.ocorrencia_tipo}</Badge>} />
        ))}
      </Card>
    </>
  );
}

export function PortalNovaOcorrencia() {
  const p = usePortal();
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState({ titulo: "", desc: "" });
  const [erro, setErro] = useState("");
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!v.titulo.trim() || !v.desc.trim()) return setErro(t("Preencha título e descrição."));
    await ocorrenciaStore.create({ ocorrencia_morador_id: p.moradorId, morador_nome: p.nome, ocorrencia_titulo: v.titulo.trim(), ocorrencia_descricao: v.desc.trim(), ocorrencia_data_ocorrencia: agora(), ocorrencia_tipo: "ABERTA", ocorrencia_status: 1 });
    toast(t("Ocorrência enviada ao síndico."));
    router.push("/portal/ocorrencias");
  };
  return (
    <>
      <PageHeader title={t("Abrir Ocorrência")} sub={t("Conte ao síndico o que precisa de atenção.")} />
      <form onSubmit={enviar} noValidate>
        <FormCard title={t("Descreva o problema")} erro={erro} onCancel={() => router.back()} submit={t("Enviar ocorrência")}>
          <Campo id="t" label={t("Título")}>
            <input id="t" className={inputCls} value={v.titulo} placeholder={t("Ex.: Vazamento no teto da garagem")} onChange={(e) => setV((x) => ({ ...x, titulo: e.target.value }))} />
          </Campo>
          <Campo id="ds" label={t("Descrição")}>
            <textarea id="ds" className={`${inputCls} min-h-[84px] resize-y`} value={v.desc} placeholder={t("Descreva com detalhes o que está acontecendo")} onChange={(e) => setV((x) => ({ ...x, desc: e.target.value }))} />
          </Campo>
          <div className="col-span-full text-[11.5px] text-muted">🔒 {t("A ocorrência é registrada automaticamente no seu nome.")}</div>
        </FormCard>
      </form>
    </>
  );
}
