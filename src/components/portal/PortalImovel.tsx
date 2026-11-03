"use client";

import { Card, DetailGrid, Empty, Hero, HeroBadges, KV, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { usePortal } from "@/components/layouts/PortalShell";

export function PortalImovel() {
  const p = usePortal();
  const v = p.vinculo;
  const im = v?.imovel;
  return (
    <>
      <PageHeader title="Meu Imóvel" sub="Dados do imóvel vinculado à sua conta." />
      {!v ? (
        <Card>
          <Empty>Você ainda não tem imóvel vinculado.</Empty>
        </Card>
      ) : (
        <>
          <Hero color="green">
            <small className="text-[10.5px] font-bold tracking-[0.04em] opacity-85">MEU IMÓVEL</small>
            <h2 className="mt-1 mb-2.5 text-[22px] font-extrabold">
              {p.imovelLabel} · {p.blocoNome}
            </h2>
            <HeroBadges items={[v.moradorImovelTipoRelacao]} />
          </Hero>
          <DetailGrid>
            <Card title="Dados do imóvel">
              {[
                ["Número", im?.imovelNumero],
                ["Andar", im?.imovelAndar ?? "—"],
                ["Bloco", p.blocoNome],
                ["Tipo", im?.imovelTipo],
                ["Área", im?.imovelAreaM2 ? `${Number(im.imovelAreaM2).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} m²` : "—"],
                ["Vagas de garagem", im?.imovelGaragem ?? "—"],
              ].map(([k, val]) => (
                <KV k={String(k)} key={String(k)}>
                  {String(val ?? "—")}
                </KV>
              ))}
            </Card>
            <Card title="Sua relação">
              <KV k="tipo">
                {v.moradorImovelTipoRelacao} · desde {fmtDate(v.moradorImovelDataInicio)}
              </KV>
              <KV k="fim">{fmtDate(v.moradorImovelDataFim)}</KV>
            </Card>
          </DetailGrid>
        </>
      )}
    </>
  );
}
