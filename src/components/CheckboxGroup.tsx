'use client';

import { cx } from './ui';
import type { Option } from '@/models/types';

// Grupo de opções de múltipla escolha, com o mesmo visual dos botões do campo "radio".
// `value` é a lista dos valores marcados. `disabledReason(valor, marcados)` devolve o motivo pelo qual uma
// opção não pode ser marcada agora (ou null); uma opção já marcada nunca fica bloqueada, para poder ser desmarcada.
export function CheckboxGroup({
  id,
  value,
  options,
  onChange,
  disabledReason,
}: {
  id?: string;
  value: string[];
  options: Option[];
  onChange: (v: string[]) => void;
  disabledReason?: (option: string, selected: string[]) => string | null;
}) {
  const marcados = Array.isArray(value) ? value : [];

  const alternar = (v: string) => onChange(marcados.includes(v) ? marcados.filter((x) => x !== v) : [...marcados, v]);

  return (
    <div id={id} className="flex flex-wrap gap-2" role="group">
      {options.map((o) => {
        const v = String(o.value);
        const on = marcados.includes(v);
        const motivo = on ? null : (disabledReason?.(v, marcados) ?? null);
        return (
          <button
            key={v}
            type="button"
            role="checkbox"
            aria-checked={on}
            aria-disabled={motivo ? true : undefined}
            title={motivo ?? undefined}
            onClick={() => {
              if (!motivo) alternar(v);
            }}
            className={cx(
              'rounded-[9px] border px-3.5 py-2 text-xs font-bold',
              on ? 'border-primary bg-soft-blue text-link' : 'border-line bg-surface',
              motivo && 'cursor-not-allowed opacity-45',
            )}
          >
            <span aria-hidden="true">{on ? '✓ ' : ''}</span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
