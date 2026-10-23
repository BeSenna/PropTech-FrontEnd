"use client";
import type { ReactNode } from "react";
import { PortalShell } from "@/components/layouts/PortalShell";
import { RequireRole } from "@/components/layouts/RequireRole";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole role="MORADOR">
      <PortalShell>{children}</PortalShell>
    </RequireRole>
  );
}
