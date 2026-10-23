"use client";

import type { ReactNode } from "react";
import { btn } from "./ui";

export function ConfirmModal({
  title,
  text,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  text?: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/45 p-4" onClick={onCancel} role="presentation">
      <div className="w-full max-w-[420px] rounded-[14px] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)]" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3 className="m-0 mb-2 text-base font-extrabold text-navy">{title}</h3>
        {text && <p className="m-0 mb-[18px] text-[13px] text-ink-2">{text}</p>}
        {children}
        <div className="flex justify-end gap-2.5">
          <button type="button" className={btn("ghost")} onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={btn(danger ? "danger" : "primary")} disabled={busy} onClick={onConfirm}>
            {busy ? "Aguarde…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
