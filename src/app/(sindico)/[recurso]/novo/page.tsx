"use client";
import { notFound, useParams } from "next/navigation";
import ResourceForm from "@/components/resource/ResourceForm";
import { findResource } from "@/resources";

export default function Page() {
  const { recurso } = useParams<{ recurso: string }>();
  const cfg = findResource(recurso);
  if (!cfg) notFound();
  return <ResourceForm cfg={cfg} mode="create" />;
}
