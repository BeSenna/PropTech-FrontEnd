'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/i18n';
import { brToIso, isoToBr, maskDataBr } from '@/lib/format';
import { inputCls } from './ui';

const ISO = /^\d{4}-\d{2}-\d{2}/;

// Campo de data no padrão brasileiro. `value` é ISO (AAAA-MM-DD) quando a data é válida; enquanto o texto está
// incompleto ou inválido, `value` leva o próprio texto digitado (e o `validate` do campo recusa o envio).
export function DateInputBR({ id, value, onChange, className, placeholder = 'DD/MM/AAAA' }: { id?: string; value: string; onChange: (v: string) => void; className?: string; placeholder?: string }) {
  const t = useT();
  const [txt, setTxt] = useState(() => (ISO.test(value) ? isoToBr(value) : value));

  // Valor trocado de fora (carregar edição, limpar formulário): reflete no texto.
  useEffect(() => {
    if (ISO.test(value)) {
      if (brToIso(txt) !== value.slice(0, 10)) setTxt(isoToBr(value));
    } else if (value === '' && brToIso(txt) !== null) {
      setTxt('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      id={id}
      className={className ?? inputCls}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={10}
      placeholder={t(placeholder)}
      value={txt}
      onChange={(e) => {
        const m = maskDataBr(e.target.value);
        setTxt(m);
        onChange(brToIso(m) ?? m);
      }}
    />
  );
}
