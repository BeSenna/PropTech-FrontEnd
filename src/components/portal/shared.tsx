"use client";

import type { ReactNode } from "react";
import { btn, Card, ErrorBox } from "@/components/ui";
import { avisoStore, ocorrenciaStore, reservaStore } from "@/mock/data";
import type { Rec } from "@/models/types";

export const horario = (r: Rec) => `${String(r.reserva_horario_inicio).slice(0, 2).replace(/^0/, "")}h–${String(r.reserva_horario_fim).slice(0, 2).replace(/^0/, "")}h`;
export const agora = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
export const primeiroNome = (n: string) => n.split(" ").slice(0, 2).join(" ");

export const minhasReservas = (id: number) => reservaStore.all().filter((r) => r.reserva_morador_id === id);
export const minhasOcorrencias = (id: number) => ocorrenciaStore.all().filter((r) => r.ocorrencia_morador_id === id);
export const avisosAtivos = () => avisoStore.all().filter((a) => a.avisos_status === 1);

export const labelCls = "text-[11.5px] font-bold text-ink-2";
export const Campo = ({ id, label, half, children }: { id: string; label: string; half?: boolean; children: ReactNode }) => (
  <div className={`flex flex-col gap-[7px] ${half ? "" : "col-span-full"}`}>
    <label htmlFor={id} className={labelCls}>
      {label}
    </label>
    {children}
  </div>
);
export const FormCard = ({ title, erro, children, onCancel, submit }: { title: string; erro: string; children: ReactNode; onCancel: () => void; submit: string }) => (
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
