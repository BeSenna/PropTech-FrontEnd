import type { ReactNode } from 'react';

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
    <div className="modal-back" onClick={onCancel} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {text && <p>{text}</p>}
        {children}
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={busy} onClick={onConfirm}>
            {busy ? 'Aguarde…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
