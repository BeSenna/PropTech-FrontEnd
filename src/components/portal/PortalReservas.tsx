"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Badge, btn, Card, Empty, inputCls, PageHeader, RowItem } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { fmtDate } from "@/lib/format";
import { areaStore, reservaStore } from "@/mock/data";
import { usePortal } from "@/components/layouts/PortalShell";
import { horario, minhasReservas, Campo, FormCard } from './shared';

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
      <PageHeader title="Nova Reserva" sub="Escolha a área, a data e o horário." />
      <form onSubmit={enviar} noValidate>
        <FormCard title="Dados da reserva" erro={erro} onCancel={() => router.back()} submit="Solicitar reserva">
          <Campo id="a" label="Área comum">
            <select id="a" className={inputCls} value={v.area} onChange={(e) => set("area", e.target.value)}>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.area_comum_nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo id="d" label="Data da reserva">
            <input id="d" type="date" className={inputCls} value={v.data} onChange={(e) => set("data", e.target.value)} />
          </Campo>
          <Campo id="i" label="Horário início" half>
            <input id="i" type="time" className={inputCls} value={v.ini} onChange={(e) => set("ini", e.target.value)} />
          </Campo>
          <Campo id="f" label="Horário fim" half>
            <input id="f" type="time" className={inputCls} value={v.fim} onChange={(e) => set("fim", e.target.value)} />
          </Campo>
          <div className="col-span-full text-[11.5px] text-muted">🔒 A reserva é registrada automaticamente no seu nome.</div>
        </FormCard>
      </form>
    </>
  );
}
