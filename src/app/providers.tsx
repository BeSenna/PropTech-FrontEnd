"use client";

import { Suspense, type ReactNode } from "react";
import { AuthProvider } from "@/auth/AuthContext";
import { ToastProvider } from "@/components/Toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={null}>{children}</Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
