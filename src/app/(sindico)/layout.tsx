"use client";
import type { ReactNode } from "react";
import { RequireRole } from "@/components/layouts/RequireRole";
import { SindicoShell } from "@/components/layouts/SindicoShell";

export default function SindicoLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="SINDICO">
      <SindicoShell>{children}</SindicoShell>
    </RequireRole>
  );
}
