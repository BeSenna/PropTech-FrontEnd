"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge, btn, Card, DetailGrid, ErrorBox, Hero, HeroBadges, KV, Loading, PageHeader, RelatedList } from "@/components/ui";
import { ConfirmModal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { limparCache } from "@/resources/api";
import type { Rec, RelatedPanel, ResourceConfig } from "@/lib/types";

export default function ResourceDetail({ cfg, id }: { cfg: ResourceConfig; id: string }) {
  const toast = useToast();
  const [row, setRow] = useState<Rec | null>(null);
  const [rel, setRel] = useState<RelatedPanel | null>(null);
  const [erro, setErro] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const r = await cfg.adapter.get(id);
      setRow(r);
      setRel((await cfg.related?.(r, {})) ?? null);
    } catch (e) {
      setErro((e as Error).message);
    }
  }, [cfg, id]);

  useEffect(() => {
    setRow(null);
    setErro("");
    void carregar();
  }, [carregar]);

  if (erro) return <ErrorBox>{erro}</ErrorBox>;
  if (!row) return <Loading />;

  const hero = cfg.hero!;
  const ativo = cfg.statusOf(row) === 1;
  const desativar = async () => {
    setBusy(true);
    try {
      await cfg.adapter.remove(id);
      limparCache();
      toast(`${cfg.inactivate.label === "Desativar" ? "Desativado" : "Atualizado"} com sucesso.`);
      setConfirmando(false);
      await carregar();
    } catch (e) {
      toast((e as Error).message, "erro");
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
          <Link href={`${cfg.path}/${id}/editar`} className={btn("outline")}>
            Editar
          </Link>
        }
      />

      <Hero
        color={hero.color}
        actions={
          <>
            <Link href={`${cfg.path}/${id}/editar`} className={btn("glass")}>
              Editar {cfg.singular}
            </Link>
            {cfg.detailActions?.(row).map((a) => (
              <Link key={a.label} href={a.to} className={btn("white")}>
                {a.label}
              </Link>
            ))}
            {cfg.extraDetail?.(row, () => void carregar())}
            {ativo && (
              <button type="button" className={btn("glass")} onClick={() => setConfirmando(true)}>
                {cfg.inactivate.label}
              </button>
            )}
          </>
        }
      >
        <small className="text-[10.5px] font-bold tracking-[0.04em] opacity-85">{hero.kind}</small>
        <h2 className="mt-1 mb-2.5 text-[22px] font-extrabold">{cfg.rowTitle(row)}</h2>
        <HeroBadges items={hero.badges(row)} />
        {hero.sub && <div className="mt-2 text-[12.5px] opacity-90">{hero.sub(row)}</div>}
      </Hero>

      <DetailGrid>
        <Card title={cfg.detailTitle ?? "Dados"}>
          {cfg.detailRows?.(row).map(([k, v]) => (
            <KV k={k} key={k}>
              {typeof v === "string" && ["ATIVO", "ATIVA", "INATIVO", "INATIVA"].includes(v) ? <Badge>{v}</Badge> : v}
            </KV>
          ))}
        </Card>
        {rel && <RelatedList title={rel.title} items={rel.items} footer={rel.footer} />}
      </DetailGrid>

      {confirmando && <ConfirmModal title={`${cfg.inactivate.label}?`} text={cfg.inactivate.confirm} confirmLabel={cfg.inactivate.label} danger busy={busy} onConfirm={desativar} onCancel={() => setConfirmando(false)} />}
    </>
  );
}
