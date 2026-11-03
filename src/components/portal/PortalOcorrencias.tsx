"use client";

import Link from "next/link";
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
  const os = minhasOcorrencias(p.moradorId);
  return (
    <>
      <PageHeader
        title="Minhas Ocorrências"
        sub="Problemas que você reportou."
        actions={
          <Link className={btn("amber")} href="/portal/ocorrencias/nova">
            + Abrir ocorrência
          </Link>
        }
      />
      <Card title="Ocorrências" count={os.length}>
        {os.length === 0 && <Empty>Você ainda não abriu ocorrências.</Empty>}
        {os.map((o) => (
          <RowItem key={o.id} ico="⚠️" tint="#fef3c7" title={o.ocorrencia_titulo} sub={fmtDate(o.ocorrencia_data_ocorrencia)} right={<Badge>{o.ocorrencia_tipo}</Badge>} />
        ))}
      </Card>
    </>
  );
}

export function PortalNovaOcorrencia() {
  const p = usePortal();
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState({ titulo: "", desc: "" });
  const [erro, setErro] = useState("");
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!v.titulo.trim() || !v.desc.trim()) return setErro("Preencha título e descrição.");
    await ocorrenciaStore.create({ ocorrencia_morador_id: p.moradorId, morador_nome: p.nome, ocorrencia_titulo: v.titulo.trim(), ocorrencia_descricao: v.desc.trim(), ocorrencia_data_ocorrencia: agora(), ocorrencia_tipo: "ABERTA", ocorrencia_status: 1 });
    toast("Ocorrência enviada ao síndico.");
    router.push("/portal/ocorrencias");
  };
  return (
    <>
      <PageHeader title="Abrir Ocorrência" sub="Conte ao síndico o que precisa de atenção." />
      <form onSubmit={enviar} noValidate>
        <FormCard title="Descreva o problema" erro={erro} onCancel={() => router.back()} submit="Enviar ocorrência">
          <Campo id="t" label="Título">
            <input id="t" className={inputCls} value={v.titulo} placeholder="Ex.: Vazamento no teto da garagem" onChange={(e) => setV((x) => ({ ...x, titulo: e.target.value }))} />
          </Campo>
          <Campo id="ds" label="Descrição">
            <textarea id="ds" className={`${inputCls} min-h-[84px] resize-y`} value={v.desc} placeholder="Descreva com detalhes o que está acontecendo" onChange={(e) => setV((x) => ({ ...x, desc: e.target.value }))} />
          </Campo>
          <div className="col-span-full text-[11.5px] text-muted">🔒 A ocorrência é registrada automaticamente no seu nome.</div>
        </FormCard>
      </form>
    </>
  );
}
