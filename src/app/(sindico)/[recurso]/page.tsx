"use client";
import { notFound, useParams } from "next/navigation";
import ResourceList from "@/components/resource/ResourceList";
import { findResource } from "@/resources";

export default function Page() {
  const { recurso } = useParams<{ recurso: string }>();
  const cfg = findResource(recurso);
  if (!cfg) notFound();
  return <ResourceList cfg={cfg} />;
}
