import { useState } from 'react';
import { ConfirmModal } from './Modal';
import { useToast } from './Toast';
import { encerrarVinculo, limparCache } from '../resources/api';
import { hoje } from '../lib/format';
import type { Rec } from '../lib/types';

// Encerra o vínculo (PATCH /morador-imovel/:id/encerrar). O estado ATIVO/ENCERRANDO/ENCERRADO é derivado da data.
export function EncerrarButton({ row, reload }: { row: Rec; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(hoje());
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  if (row.moradorImovelStatus !== 1 || row.estado === 'ENCERRADO') return null;
  const confirmar = async () => {
    setBusy(true);
    try {
      await encerrarVinculo(row.moradorImovelId, data);
      limparCache();
      toast('Vínculo encerrado.');
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
      <button type="button" className="btn btn-glass" onClick={() => setOpen(true)}>
        Encerrar vínculo
      </button>
      {open && (
        <ConfirmModal title="Encerrar vínculo" text="Informe a data de fim. Se for futura, o vínculo fica ENCERRANDO até lá." confirmLabel="Encerrar" busy={busy} onConfirm={confirmar} onCancel={() => setOpen(false)}>
          <div className="field" style={{ marginBottom: 18 }}>
            <label htmlFor="df">Data de fim · morador_imovel_data_fim</label>
            <input id="df" className="input" type="date" value={data} min={String(row.moradorImovelDataInicio).slice(0, 10)} onChange={(e) => setData(e.target.value)} />
          </div>
        </ConfirmModal>
      )}
    </>
  );
}
