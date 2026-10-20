import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Card, ErrorBox, Loading, PageHeader, RelatedList } from '../components/ui';
import { ConfirmModal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { limparCache } from '../resources/api';
import type { RelatedPanel, Rec, ResourceConfig } from '../lib/types';

export default function ResourceDetail({ cfg }: { cfg: ResourceConfig }) {
  const { id } = useParams();
  const toast = useToast();
  const [row, setRow] = useState<Rec | null>(null);
  const [rel, setRel] = useState<RelatedPanel | null>(null);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const r = await cfg.adapter.get(id!);
      setRow(r);
      setRel((await cfg.related?.(r, {})) ?? null);
    } catch (e) {
      setErro((e as Error).message);
    }
  }, [cfg, id]);

  useEffect(() => {
    setRow(null);
    setErro('');
    void carregar();
  }, [carregar]);

  if (erro) return <ErrorBox>{erro}</ErrorBox>;
  if (!row) return <Loading />;

  const hero = cfg.hero!;
  const ativo = cfg.statusOf(row) === 1;
  const desativar = async () => {
    setBusy(true);
    try {
      await cfg.adapter.remove(id!);
      limparCache();
      toast(`${cfg.inactivate.label === 'Desativar' ? 'Desativado' : 'Atualizado'} com sucesso.`);
      setConfirmando(false);
      await carregar();
    } catch (e) {
      toast((e as Error).message, 'erro');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={cfg.rowTitle(row)}
        sub={cfg.idLabel(row)}
        actions={
          <Link to={`${cfg.path}/${id}/editar`} className="btn btn-outline">
            Editar
          </Link>
        }
      />

      <div className={`hero hero-${hero.color}`}>
        <div>
          <small className="kind">{hero.kind}</small>
          <h2>{cfg.rowTitle(row)}</h2>
          <div className="badges">
            {hero.badges(row).map((b) => (
              <span key={b}>{b}</span>
            ))}
          </div>
          {hero.sub && <div className="hero-sub">{hero.sub(row)}</div>}
        </div>
        <div className="hero-actions">
          <Link to={`${cfg.path}/${id}/editar`} className="btn btn-glass">
            Editar {cfg.singular}
          </Link>
          {cfg.detailActions?.(row).map((a) => (
            <Link key={a.label} to={a.to} className="btn btn-white">
              {a.label}
            </Link>
          ))}
          {cfg.extraDetail?.(row, () => void carregar())}
          {ativo && (
            <button type="button" className="btn btn-glass" onClick={() => setConfirmando(true)}>
              {cfg.inactivate.label}
            </button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <Card title={cfg.detailTitle ?? 'Dados'}>
          {cfg.detailRows?.(row).map(([k, v]) => (
            <div className="kv" key={k}>
              <span>{k}</span>
              <b>{typeof v === 'string' && ['ATIVO', 'ATIVA', 'INATIVO', 'INATIVA'].includes(v) ? <Badge>{v}</Badge> : v}</b>
            </div>
          ))}
        </Card>
        {rel && <RelatedList title={rel.title} items={rel.items} footer={rel.footer} />}
      </div>

      {confirmando && (
        <ConfirmModal title={`${cfg.inactivate.label}?`} text={cfg.inactivate.confirm} confirmLabel={cfg.inactivate.label} danger busy={busy} onConfirm={desativar} onCancel={() => setConfirmando(false)} />
      )}
    </>
  );
}
