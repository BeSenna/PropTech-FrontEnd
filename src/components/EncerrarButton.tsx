'use client';

import { useState } from 'react';
import { t, useT } from '@/i18n';
import { ConfirmModal } from './Modal';
import { btn } from './ui';
import { useToast } from './Toast';
import { encerrarVinculo, limparCache } from '@/services/moradorService';
import { DateInputBR } from './DateInputBR';
import { hoje, validarDataBr } from '@/lib/format';
import type { Rec } from '@/models/types';

// Encerra o vínculo (PATCH /morador-imovel/:id/encerrar). O estado ATIVO/ENCERRANDO/ENCERRADO é derivado da data.
export function EncerrarButton({ row, reload }: { row: Rec; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(hoje());
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useT();
  if (row.moradorImovelStatus !== 1 || row.estado === 'ENCERRADO') return null;
  const confirmar = async () => {
    const erro = validarDataBr(data) ?? (data < String(row.moradorImovelDataInicio).slice(0, 10) ? t('A data de fim não pode ser anterior ao início do vínculo.') : null);
    if (erro) {
      toast(erro, 'erro');
      return;
    }
    setBusy(true);
    try {
      await encerrarVinculo(row.moradorImovelId, data);
      limparCache();
      toast(t('Vínculo encerrado.'));
      setOpen(false);
      reload();
    } catch (e) {
      toast((e as Error).message, 'erro');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button type="button" className={btn('glass')} onClick={() => setOpen(true)}>
        {t('Encerrar vínculo')}
      </button>
      {open && (
        <ConfirmModal title="Encerrar vínculo" text="Informe a data de fim. Se for futura, o vínculo fica ENCERRANDO até lá." confirmLabel="Encerrar" busy={busy} onConfirm={confirmar} onCancel={() => setOpen(false)}>
          <div className="mb-[18px] flex flex-col gap-[7px]">
            <label htmlFor="df" className="text-[11.5px] font-bold text-ink-2">{t('Data de fim')}</label>
            <DateInputBR id="df" value={data} onChange={setData} />
          </div>
        </ConfirmModal>
      )}
    </>
  );
}
