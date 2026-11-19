"use client";

import { Card, DetailGrid, Empty, Hero, HeroBadges, KV, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { gruposDeImoveis, rotuloTipo } from "@/lib/relacao";
import { usePortal } from "@/components/layouts/PortalShell";
import { imovelRotulo } from "@/services/moradorService";

export function PortalImovel() {
  const p = usePortal();
  // um bloco por imóvel; no mesmo imóvel a pessoa pode ser Proprietário e Morador ao mesmo tempo
  const grupos = gruposDeImoveis(p.vinculos);
  return (
    <>
      <PageHeader title={grupos.length > 1 ? "Meus Imóveis" : "Meu Imóvel"} sub={grupos.length > 1 ? "Dados dos imóveis vinculados à sua conta." : "Dados do imóvel vinculado à sua conta."} />
      {grupos.length === 0 ? (
        <Card>
          <Empty>Você ainda não tem imóvel vinculado.</Empty>
        </Card>
      ) : (
        grupos.map((g) => {
          const im = g.imovel;
          const rotulo = im ? imovelRotulo(im, undefined).replace(/ · .*/, "") : `Imóvel #${g.imovelId}`;
          const bloco = g.blocoNome ?? im?.bloco?.blocoNome ?? "";
          return (
            <section key={g.imovelId} className="mb-8" aria-label={`${rotulo}${bloco ? ` · ${bloco}` : ""}`}>
              <Hero color="green">
                <small className="text-[10.5px] font-bold tracking-[0.04em] opacity-85">{grupos.length > 1 ? "IMÓVEL" : "MEU IMÓVEL"}</small>
                <h2 className="mt-1 mb-2.5 text-[22px] font-extrabold">
                  {rotulo}
                  {bloco ? ` · ${bloco}` : ""}
                </h2>
                <HeroBadges items={g.tipos} />
              </Hero>
              <DetailGrid>
                <Card title="Dados do imóvel">
                  {[
                    ["Número", im?.imovelNumero],
                    ["Andar", im?.imovelAndar ?? "—"],
                    ["Bloco", bloco],
                    ["Tipo", im?.imovelTipo],
                    ["Área", im?.imovelAreaM2 ? `${Number(im.imovelAreaM2).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} m²` : "—"],
                    ["Vagas de garagem", im?.imovelGaragem ?? "—"],
                  ].map(([k, val]) => (
                    <KV k={String(k)} key={String(k)}>
                      {String(val ?? "—")}
                    </KV>
                  ))}
                </Card>
                <Card title={g.relacoes.length > 1 ? "Suas relações" : "Sua relação"}>
                  {g.relacoes.map((r) => (
                    <KV k={g.relacoes.length > 1 ? rotuloTipo(r.moradorImovelTipoRelacao) : "tipo"} key={r.moradorImovelId}>
                      {g.relacoes.length > 1 ? `desde ${fmtDate(r.moradorImovelDataInicio)}${r.moradorImovelDataFim ? ` · até ${fmtDate(r.moradorImovelDataFim)}` : ""}` : `${r.moradorImovelTipoRelacao} · desde ${fmtDate(r.moradorImovelDataInicio)}`}
                    </KV>
                  ))}
                  {g.relacoes.length === 1 && <KV k="fim">{fmtDate(g.relacoes[0].moradorImovelDataFim)}</KV>}
                </Card>
              </DetailGrid>
            </section>
          );
        })
      )}
    </>
  );
}
