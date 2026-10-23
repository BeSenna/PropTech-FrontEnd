"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Badge, btn, Card, DetailGrid, Empty, ErrorBox, Hero, HeroBadges, inputCls, KV, PageHeader, RowItem, StatCard, StatGrid } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { competenciaTxt, fmtDate, fmtMoney } from "@/lib/format";
import { areaStore, avisoStore, cobrancaStore, ocorrenciaStore, reservaStore } from "@/mock/data";
import { usePortal } from "@/components/layouts/PortalShell";
import type { Rec } from "@/lib/types";

const horario = (r: Rec) => `${String(r.reserva_horario_inicio).slice(0, 2).replace(/^0/, "")}h–${String(r.reserva_horario_fim).slice(0, 2).replace(/^0/, "")}h`;
const agora = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const primeiroNome = (n: string) => n.split(" ").slice(0, 2).join(" ");

const minhasReservas = (id: number) => reservaStore.all().filter((r) => r.reserva_morador_id === id);
const minhasOcorrencias = (id: number) => ocorrenciaStore.all().filter((r) => r.ocorrencia_morador_id === id);
const avisosAtivos = () => avisoStore.all().filter((a) => a.avisos_status === 1);


const labelCls = "text-[11.5px] font-bold text-ink-2";
const Campo = ({ id, label, half, children }: { id: string; label: string; half?: boolean; children: ReactNode }) => (
  <div className={`flex flex-col gap-[7px] ${half ? "" : "col-span-full"}`}>
    <label htmlFor={id} className={labelCls}>
      {label}
    </label>
    {children}
  </div>
);
const FormCard = ({ title, erro, children, onCancel, submit }: { title: string; erro: string; children: ReactNode; onCancel: () => void; submit: string }) => (
  <Card title={title} className="max-w-[760px]">
    {erro && (
      <div className="mx-[26px] mt-3.5">
        <ErrorBox>{erro}</ErrorBox>
      </div>
    )}
    <div className="grid grid-cols-1 gap-x-5 gap-y-[18px] px-[26px] pt-[22px] pb-2 min-[820px]:grid-cols-2">{children}</div>
    <div className="mt-2 flex gap-2.5 border-t border-line-soft px-[26px] pt-[18px] pb-6">
      <button type="button" className={btn("ghost")} onClick={onCancel}>
        Cancelar
      </button>
      <button className={btn("primary")}>{submit}</button>
    </div>
  </Card>
);

export function PortalHome() {
  const p = usePortal();
  const reservas = minhasReservas(p.moradorId).filter((r) => r.reserva_status === 1);
  const ocs = minhasOcorrencias(p.moradorId).filter((o) => o.ocorrencia_tipo === "EM_ANDAMENTO");
  const avisos = avisosAtivos();
  return (
    <>
      <PageHeader
        back={false}
        title={`Olá, ${primeiroNome(p.nome)} 👋`}
        sub={`${p.imovelLabel ? `${p.imovelLabel} · ${p.blocoNome}` : "Sem imóvel vinculado"} — bem-vindo(a) ao seu portal.`}
        actions={
          <>
            <Link className={btn("outline")} href="/portal/reservas/nova">
              + Nova reserva
            </Link>
            <Link className={btn("amber")} href="/portal/ocorrencias/nova">
              + Abrir ocorrência
            </Link>
          </>
        }
      />
      <StatGrid>
        <StatCard value={p.vinculo ? 1 : 0} label="Imóvel vinculado" color="navy" />
        <StatCard value={reservas.length} label="Reservas ativas" color="green" className="border-l-[#7c3aed]!" />
        <StatCard value={ocs.length} label="Ocorrência em andamento" color="amber" className="border-l-[#ea580c]!" />
        <StatCard value={avisos.length} label="Avisos ativos" color="pink" className="border-l-[#0284c7]!" />
      </StatGrid>
      <DetailGrid even>
        <Card title="Minhas próximas reservas">
          {reservas.length === 0 && <Empty>Nenhuma reserva ativa.</Empty>}
          {reservas.slice(0, 4).map((r) => (
            <RowItem key={r.id} ico="📅" tint="#ede9fe" title={r.area_comum_label} sub={`${fmtDate(r.reserva_data_reserva)} · ${horario(r)}`} right={<Badge>{r.reserva_tipo}</Badge>} />
          ))}
        </Card>
        <Card title="Avisos recentes">
          {avisos.length === 0 && <Empty>Nenhum aviso.</Empty>}
          {avisos.slice(0, 4).map((a) => (
            <RowItem key={a.id} ico="📢" tint="#e0f2fe" title={a.avisos_titulo} sub={fmtDate(a.avisos_data_publicacao)} />
          ))}
        </Card>
      </DetailGrid>
    </>
  );
}

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
                ["imovel_numero", im?.imovelNumero],
                ["imovel_andar", im?.imovelAndar ?? "—"],
                ["bloco_id", p.blocoNome],
                ["imovel_tipo", im?.imovelTipo],
                ["imovel_area_m2", im?.imovelAreaM2 ? `${Number(im.imovelAreaM2).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} m²` : "—"],
                ["imovel_garagem", im?.imovelGaragem ?? "—"],
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

export function PortalReservas() {
  const p = usePortal();
  const rs = minhasReservas(p.moradorId);
  return (
    <>
      <PageHeader
        title="Minhas Reservas"
        sub="Áreas comuns que você reservou."
        actions={
          <Link className={btn("primary")} href="/portal/reservas/nova">
            + Nova reserva
          </Link>
        }
      />
      <Card title="Reservas" count={rs.length}>
        {rs.length === 0 && <Empty>Você ainda não fez reservas.</Empty>}
        {rs.map((r) => (
          <RowItem key={r.id} ico="📅" tint="#ede9fe" title={r.area_comum_label} sub={`${fmtDate(r.reserva_data_reserva)} · ${horario(r)}`} right={<Badge>{r.reserva_tipo}</Badge>} />
        ))}
      </Card>
    </>
  );
}

export function PortalNovaReserva() {
  const p = usePortal();
  const router = useRouter();
  const toast = useToast();
  const areas = areaStore.all().filter((a) => a.area_comum_status === 1);
  const [v, setV] = useState({ area: String(areas[0]?.id ?? ""), data: "", ini: "", fim: "" });
  const set = (k: keyof typeof v, val: string) => setV((x) => ({ ...x, [k]: val }));
  const [erro, setErro] = useState("");
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const a = areas.find((x) => String(x.id) === v.area);
    if (!a || !v.data || !v.ini || !v.fim) return setErro("Preencha todos os campos.");
    if (v.fim <= v.ini) return setErro("O horário final deve ser depois do inicial.");
    const conflito = reservaStore.all().some((r) => r.area_comum_id === a.id && r.reserva_status === 1 && r.reserva_data_reserva === v.data && r.reserva_horario_inicio < v.fim && r.reserva_horario_fim > v.ini);
    if (conflito) return setErro("Já existe uma reserva nesse horário para esta área.");
    await reservaStore.create({ area_comum_id: a.id, area_comum_label: a.area_comum_nome, reserva_morador_id: p.moradorId, morador_nome: p.nome, reserva_data_reserva: v.data, reserva_horario_inicio: v.ini, reserva_horario_fim: v.fim, reserva_tipo: "PENDENTE", reserva_status: 1 });
    toast("Reserva solicitada. O síndico irá confirmar.");
    router.push("/portal/reservas");
  };
  return (
    <>
      <PageHeader title="Nova Reserva" sub="reserva" />
      <form onSubmit={enviar} noValidate>
        <FormCard title="Dados da reserva" erro={erro} onCancel={() => router.back()} submit="Solicitar reserva">
          <Campo id="a" label="Área comum · area_comum_id">
            <select id="a" className={inputCls} value={v.area} onChange={(e) => set("area", e.target.value)}>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.area_comum_nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo id="d" label="Data da reserva · reserva_data_reserva">
            <input id="d" type="date" className={inputCls} value={v.data} onChange={(e) => set("data", e.target.value)} />
          </Campo>
          <Campo id="i" label="Horário início" half>
            <input id="i" type="time" className={inputCls} value={v.ini} onChange={(e) => set("ini", e.target.value)} />
          </Campo>
          <Campo id="f" label="Horário fim" half>
            <input id="f" type="time" className={inputCls} value={v.fim} onChange={(e) => set("fim", e.target.value)} />
          </Campo>
          <div className="col-span-full text-[11.5px] text-muted">🔒 reserva_morador_id é preenchido automaticamente com base no seu login — você não escolhe outro morador.</div>
        </FormCard>
      </form>
    </>
  );
}

export function PortalOcorrencias() {
  const p = usePortal();
  const os = minhasOcorrencias(p.moradorId);
  return (
    <>
      <PageHeader
        title="Minhas Ocorrências"
        sub="Problemas que você reportou."
        actions={
          <Link className={btn("amber")} href="/portal/ocorrencias/nova">
            + Abrir ocorrência
          </Link>
        }
      />
      <Card title="Ocorrências" count={os.length}>
        {os.length === 0 && <Empty>Você ainda não abriu ocorrências.</Empty>}
        {os.map((o) => (
          <RowItem key={o.id} ico="⚠️" tint="#fef3c7" title={o.ocorrencia_titulo} sub={fmtDate(o.ocorrencia_data_ocorrencia)} right={<Badge>{o.ocorrencia_tipo}</Badge>} />
        ))}
      </Card>
    </>
  );
}

export function PortalNovaOcorrencia() {
  const p = usePortal();
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState({ titulo: "", desc: "" });
  const [erro, setErro] = useState("");
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!v.titulo.trim() || !v.desc.trim()) return setErro("Preencha título e descrição.");
    await ocorrenciaStore.create({ ocorrencia_morador_id: p.moradorId, morador_nome: p.nome, ocorrencia_titulo: v.titulo.trim(), ocorrencia_descricao: v.desc.trim(), ocorrencia_data_ocorrencia: agora(), ocorrencia_tipo: "ABERTA", ocorrencia_status: 1 });
    toast("Ocorrência enviada ao síndico.");
    router.push("/portal/ocorrencias");
  };
  return (
    <>
      <PageHeader title="Abrir Ocorrência" sub="ocorrencia" />
      <form onSubmit={enviar} noValidate>
        <FormCard title="Descreva o problema" erro={erro} onCancel={() => router.back()} submit="Enviar ocorrência">
          <Campo id="t" label="Título · ocorrencia_titulo">
            <input id="t" className={inputCls} value={v.titulo} placeholder="Ex.: Vazamento no teto da garagem" onChange={(e) => setV((x) => ({ ...x, titulo: e.target.value }))} />
          </Campo>
          <Campo id="ds" label="Descrição · ocorrencia_descricao">
            <textarea id="ds" className={`${inputCls} min-h-[84px] resize-y`} value={v.desc} placeholder="Descreva com detalhes o que está acontecendo" onChange={(e) => setV((x) => ({ ...x, desc: e.target.value }))} />
          </Campo>
          <div className="col-span-full text-[11.5px] text-muted">🔒 ocorrencia_morador_id é preenchido automaticamente com base no seu login.</div>
        </FormCard>
      </form>
    </>
  );
}

export function PortalAvisos() {
  const as = avisosAtivos();
  return (
    <>
      <PageHeader title="Avisos" sub="Comunicados do síndico para os moradores." />
      <Card title="Avisos ativos" count={as.length}>
        {as.length === 0 && <Empty>Nenhum aviso ativo.</Empty>}
        {as.map((a) => (
          <RowItem key={a.id} ico="📢" tint="#e0f2fe" title={a.avisos_titulo} sub={`Publicado em ${fmtDate(a.avisos_data_publicacao)}${a.avisos_data_expiracao ? ` · expira em ${fmtDate(a.avisos_data_expiracao)}` : ""}`} />
        ))}
      </Card>
    </>
  );
}

const minhasCobrancas = (imovelId: number | null) => (imovelId ? cobrancaStore.all().filter((c) => c.imovel_id === imovelId && c.cobranca_status === 1) : []);
const comp = (iso: string) => {
  const t = competenciaTxt(iso);
  const meses: Record<string, string> = { Jan: "Janeiro", Fev: "Fevereiro", Mar: "Março", Abr: "Abril", Mai: "Maio", Jun: "Junho", Jul: "Julho", Ago: "Agosto", Set: "Setembro", Out: "Outubro", Nov: "Novembro", Dez: "Dezembro" };
  const [m, a] = t.split("/");
  return `${meses[m!] ?? m}/${a}`;
};

export function PortalCobrancas() {
  const p = usePortal();
  const cs = minhasCobrancas(p.imovelId);
  return (
    <>
      <PageHeader title="Minhas Cobranças" sub={`Cobranças do seu imóvel · ${p.imovelLabel || "—"}${p.blocoNome ? `, ${p.blocoNome}` : ""}.`} />
      <Card title="Cobranças" count={cs.length}>
        {cs.length === 0 && <Empty>Nenhuma cobrança encontrada.</Empty>}
        {cs.map((c) => (
          <RowItem
            key={c.id}
            to={`/portal/cobrancas/${c.id}`}
            ico="🧾"
            tint="#cffafe"
            title={`${comp(c.cobranca_competencia)} · ${fmtMoney(c.cobranca_valor)}`}
            sub={`${c.cobranca_tipo === "PAGO" ? "Pago" : c.cobranca_tipo === "VENCIDO" ? "Venceu" : "Vence"} em ${fmtDate(c.cobranca_vencimento)}`}
            right={<Badge>{c.cobranca_tipo}</Badge>}
          />
        ))}
      </Card>
    </>
  );
}

export function PortalCobranca() {
  const p = usePortal();
  const { id } = useParams<{ id: string }>();
  const c = minhasCobrancas(p.imovelId).find((x) => String(x.id) === id);
  if (!c) return <ErrorBox>Cobrança não encontrada.</ErrorBox>;
  return (
    <>
      <PageHeader title={`Cobrança · ${comp(c.cobranca_competencia)}`} sub={`${p.imovelLabel} · ${p.blocoNome}`} />
      <Hero
        color="navy"
        actions={
          <button type="button" className={btn("white")} onClick={() => window.print()}>
            Baixar boleto (PDF)
          </button>
        }
      >
        <small className="text-[10.5px] font-bold tracking-[0.04em] opacity-85">COBRANÇA</small>
        <h2 className="mt-1 mb-2.5 text-[22px] font-extrabold">{fmtMoney(c.cobranca_valor)}</h2>
        <HeroBadges items={[c.cobranca_tipo]} />
      </Hero>
      <DetailGrid>
        <Card title="Dados da cobrança">
          {[
            ["cobranca_descricao", c.cobranca_descricao],
            ["cobranca_competencia", fmtDate(c.cobranca_competencia)],
            ["cobranca_vencimento", fmtDate(c.cobranca_vencimento)],
            ["cobranca_tipo", c.cobranca_tipo],
          ].map(([k, v]) => (
            <KV k={k} key={k}>
              {v}
            </KV>
          ))}
        </Card>
        <Card title="Boleto">
          <KV k="boleto_linha_digitavel">{c.boleto_linha_digitavel}</KV>
          <KV k="boleto_data_emissao">{fmtDate(c.boleto_data_emissao)}</KV>
        </Card>
      </DetailGrid>
    </>
  );
}
