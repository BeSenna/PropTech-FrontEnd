"use client";
import { notFound, useParams } from "next/navigation";
import ResourceDetail from "@/components/resource/ResourceDetail";
import ResourceForm from "@/components/resource/ResourceForm";
import { findResource } from "@/resources";

export default function Page() {
  const { recurso, id } = useParams<{ recurso: string; id: string }>();
  const cfg = findResource(recurso);
  if (!cfg) notFound();
  // recursos sem tela de detalhe (ex.: áreas comuns) abrem direto na edição
  return cfg.hasDetail ? <ResourceDetail cfg={cfg} id={id} /> : <ResourceForm cfg={cfg} mode="edit" id={id} />;
}
