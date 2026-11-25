"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { t, useIdioma } from "@/i18n";
import { msgEtapaExtra, msgSalvo, textoSalvar, tituloDados, tituloForm } from "@/i18n/recurso";
import { btn, Card, cx, ErrorBox, inputCls, Loading, PageHeader } from "@/components/ui";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { DateInputBR } from "@/components/DateInputBR";
import { useToast } from "@/components/Toast";
import { limparCache, usuarioApi, vinculoApi } from "@/services/moradorService";
import { SENHA_DICA, validarSenha } from "@/lib/senha";
import { motivoOpcaoBloqueada, rotuloTipo, tiposDaOpcao, vigente } from "@/lib/relacao";
import type { FieldDef, Option, Rec, ResourceConfig } from "@/models/types";

const moneyToNumber = (s: unknown) => Number(String(s).replace(/\./g, "").replace(",", "."));
// "850.5" (a API manda dinheiro como texto, sem zero à direita) → "850,50"
const moneyToText = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2).replace(".", ",") : String(v).replace(".", ",");
};

const labelCls = "text-[11.5px] font-bold text-ink-2";

export default function ResourceForm({ cfg, mode, id }: { cfg: ResourceConfig; mode: "create" | "edit"; id?: string }) {
  const router = useRouter();
  const toast = useToast();
  const sp = useSearchParams();
  const idioma = useIdioma();
  const [values, setValues] = useState<Rec | null>(null);
  const [row, setRow] = useState<Rec | null>(null);
  const [opts, setOpts] = useState<Record<string, Option[]>>({});
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);

  const campos = useMemo(() => cfg.fields.filter((f) => !f.mode || f.mode === mode), [cfg, mode]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        if (mode === "edit") {
          const r = await cfg.adapter.get(id!);
          if (!vivo) return;
          setRow(r);
          const v = cfg.toForm(r);
          // máscara de dinheiro no campo
          for (const f of cfg.fields) if (f.type === "money") v[f.name] = moneyToText(v[f.name]);
          setValues({ ...cfg.defaults, ...v });
        } else {
          const v: Rec = { ...cfg.defaults };
          for (const f of cfg.fields) {
            const q = sp.get(f.name);
            if (q) v[f.name] = q;
          }
          setValues(v);
        }
      } catch (e) {
        if (vivo) setErro((e as Error).message);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [cfg, mode, id, sp]);

  useEffect(() => {
    let vivo = true;
    cfg.fields.forEach(async (f) => {
      if (!f.loadOptions) return;
      try {
        const o = await f.loadOptions();
        if (vivo) setOpts((x) => ({ ...x, [f.name]: o }));
      } catch (e) {
        if (vivo) setErro((e as Error).message);
      }
    });
    return () => {
      vivo = false;
    };
    // idioma: os rótulos das opções (ex.: "Apto 101") são montados na hora, então recarregam ao trocar de idioma
  }, [cfg, idioma]);

  const set = (name: string, v: unknown) => setValues((x) => ({ ...(x as Rec), [name]: v }));
  // opções fixas (ex.: PROPRIETARIO) são texto do sistema e passam pelo dicionário; as de consulta (blocos, moradores) são dados
  const optionsOf = (f: FieldDef) => (f.options ? f.options.map((x) => ({ ...x, label: t(x.label) })) : (opts[f.name] ?? []));
  // campos condicionais (visibleWhen) só valem enquanto aparecem na tela
  const visiveis = (v: Rec) => campos.filter((f) => !f.visibleWhen || f.visibleWhen(v));

  const converter = (v: Rec): Rec => {
    const out: Rec = { ...v };
    for (const f of visiveis(v)) {
      const raw = v[f.name];
      if (f.type === "number") out[f.name] = raw === "" || raw === undefined ? "" : Number(raw);
      else if (f.type === "money") out[f.name] = raw === "" || raw === undefined ? "" : moneyToNumber(raw);
      else if (f.loadOptions || f.type === "select") {
        const o = optionsOf(f).find((x) => String(x.value) === String(raw));
        out[f.name] = o ? o.value : raw;
        if (o) out[`${f.name}__label`] = o.label;
      }
    }
    return out;
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!values) return;
    setErro("");
    for (const f of visiveis(values)) {
      const v = values[f.name];
      if (f.required && (v === "" || v === undefined || v === null || (Array.isArray(v) && v.length === 0))) {
        setErro(t('Preencha o campo "{campo}".', { campo: t(f.label) }));
        return;
      }
      const msg = f.validate && v !== "" && v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0) ? f.validate(v) : null;
      if (msg) {
        setErro(msg);
        return;
      }
    }
    if (cfg.extraFormSection === "vinculoAcesso" && mode === "create" && values._acesso) {
      if (!String(values._login).trim()) return setErro(t("Informe o login de acesso."));
      const msgSenha = validarSenha(String(values._senha));
      if (msgSenha) return setErro(msgSenha);
    }
    if (values.moradorImovelDataFim && values.moradorImovelDataInicio && values.moradorImovelDataFim < values.moradorImovelDataInicio) {
      return setErro(t("O fim da relação não pode ser anterior ao início."));
    }
    setBusy(true);
    try {
      const v = converter(values);
      const payload = cfg.toPayload(v, mode);
      const saved = mode === "create" ? await cfg.adapter.create(payload) : await cfg.adapter.update(id!, payload);
      try {
        await cfg.afterSave?.(saved, v, mode);
      } catch (e2) {
        limparCache();
        toast(msgEtapaExtra(cfg, (e2 as Error).message), "erro");
        router.push(cfg.path);
        return;
      }
      limparCache();
      toast(msgSalvo(cfg, mode));
      router.push(mode === "edit" && cfg.hasDetail ? `${cfg.path}/${id}` : cfg.path);
    } catch (e3) {
      setErro((e3 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const titulo = tituloForm(cfg, mode);
  if (!values) return erro ? <ErrorBox>{erro}</ErrorBox> : <Loading />;

  return (
    <>
      <PageHeader title={titulo} sub={mode === "edit" && row ? cfg.idLabel(row) : undefined} />
      <form onSubmit={enviar} noValidate>
        <Card className="max-w-[760px]">
          <header className="border-b border-line-soft px-5 py-4">
            <h3 className="m-0 text-sm font-bold">{tituloDados(cfg)}</h3>
            {cfg.formSubtitle && <p className="mt-[3px] mb-0 text-xs text-muted">{t(cfg.formSubtitle)}</p>}
          </header>
          {erro && (
            <div className="mx-[26px] mt-3.5">
              <ErrorBox>{erro}</ErrorBox>
            </div>
          )}
          <div className="grid grid-cols-1 gap-x-5 gap-y-[18px] px-[26px] pt-[22px] pb-2 min-[820px]:grid-cols-2">
            {visiveis(values).map((f) => (
              <Field key={f.name} f={f} value={values[f.name]} values={values} options={optionsOf(f)} onChange={(v) => set(f.name, v)} />
            ))}

            {cfg.extraFormSection === "vinculoAcesso" && <VinculoExtras mode={mode} values={values} set={set} />}
          </div>
          <div className="mt-2 flex gap-2.5 border-t border-line-soft px-[26px] pt-[18px] pb-6">
            <button type="button" className={btn("ghost")} onClick={() => router.back()}>
              {t("Cancelar")}
            </button>
            <button type="submit" className={btn("primary")} disabled={busy}>
              {busy ? t("Salvando…") : textoSalvar(cfg)}
            </button>
          </div>
        </Card>
      </form>
    </>
  );
}

// Avisos e acesso da tela de relação (morador ↔ imóvel). No cadastro, olha o que o morador já tem:
// as relações dele neste imóvel (alimentam o bloqueio de combinações) e se ele já tem login (a nova relação o herda).
function VinculoExtras({ mode, values, set }: { mode: "create" | "edit"; values: Rec; set: (name: string, v: unknown) => void }) {
  useIdioma();
  const moradorId = String(values.moradorId ?? "");
  const imovelId = String(values.imovelId ?? "");
  const [rels, setRels] = useState<Rec[]>([]);
  const [conta, setConta] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "create") return;
    let vivo = true;
    (async () => {
      if (!moradorId) {
        setRels([]);
        setConta(null);
        return;
      }
      try {
        const r = await vinculoApi.list({ page: 1, pageSize: 100, filters: { moradorId } });
        if (!vivo) return;
        setRels(r.data);
        const comLogin = r.data.find((x) => x.usuarioId);
        if (!comLogin) return setConta(null);
        const u = await usuarioApi.get(comLogin.usuarioId);
        if (vivo) setConta(u.usuarioStatus === 1 ? String(u.usuarioLogin) : null);
      } catch {
        // sem a consulta o formulário continua funcionando; o backend valida tudo no envio
        if (vivo) {
          setRels([]);
          setConta(null);
        }
      }
    })();
    return () => {
      vivo = false;
    };
  }, [mode, moradorId]);

  const neste = useMemo(() => (imovelId ? rels.filter((x) => String(x.imovelId) === imovelId) : []), [rels, imovelId]);

  // o bloqueio das opções (campo "Tipo de relação") lê as relações do imóvel direto dos valores do formulário
  useEffect(() => {
    if (mode !== "create") return;
    set("_existentes", neste);
    // opção escolhida que deixou de ser possível neste imóvel (ex.: o padrão MORADOR para quem já é Inquilino dele) sai da escolha
    if (values._opcao && motivoOpcaoBloqueada(String(values._opcao), neste)) set("_opcao", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, neste]);

  // quem já tem login não cria outro: a nova relação herda o mesmo
  useEffect(() => {
    if (mode === "create" && conta) set("_acesso", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, conta]);

  const vigentes = neste.filter(vigente);
  const nTipos = tiposDaOpcao(String(values._opcao ?? "")).length || 1;

  return (
    <>
      {mode === "create" && vigentes.length > 0 && (
        <div role="status" className="col-span-full rounded-[10px] border border-warn-fg/30 bg-warn-bg px-4 py-3 text-[11.5px] text-warn-fg">
          {t("Este morador já tem neste imóvel:")} <strong>{vigentes.map((x) => rotuloTipo(String(x.moradorImovelTipoRelacao))).join(` ${t("e")} `)}</strong>. {t("No mesmo imóvel só é permitido somar Proprietário + Morador.")}
        </div>
      )}
      <div className="col-span-full grid gap-3 rounded-[10px] border border-dashed border-side-muted bg-subtle px-4 py-3.5">
        <div className="text-[11.5px] font-bold">{t("Acesso ao sistema")}</div>
        {mode === "edit" ? (
          <div className="text-[11px] text-muted">
            {values._usuarioId ? t("Esta relação já tem acesso (conta #{id}). O login é da pessoa: vale para todas as relações dela. Gerencie a conta em Usuários.", { id: String(values._usuarioId) }) : t("Esta relação não tem acesso ao Portal do Morador. Para dar acesso, vá em Usuários → Novo, escolha o perfil MORADOR e selecione esta relação.")}
          </div>
        ) : conta ? (
          <div className="text-[11px] text-muted">
            {t("Este morador já tem acesso ao Portal do Morador (login")} <strong>{conta}</strong>). {nTipos > 1 ? t("As novas relações usam esse mesmo login.") : t("A nova relação usa esse mesmo login.")}
          </div>
        ) : (
          <>
            <Toggle title={t("Conceder acesso ao Portal do Morador")} hint={nTipos > 1 ? t("Cria uma conta de login compartilhada pelas relações cadastradas agora") : t("Cria uma conta de login vinculada a esta relação")} on={!!values._acesso} onChange={() => set("_acesso", !values._acesso)} wide />
            {values._acesso && (
              <div className="grid grid-cols-1 gap-3 min-[820px]:grid-cols-2">
                <div className="flex flex-col gap-[7px]">
                  <label htmlFor="f_login" className={labelCls}>
                    {t("Login")}
                  </label>
                  <input id="f_login" className={inputCls} value={values._login} maxLength={100} onChange={(e) => set("_login", e.target.value)} placeholder={t("seu.login")} autoComplete="off" />
                </div>
                <div className="flex flex-col gap-[7px]">
                  <label htmlFor="f_senha" className={labelCls}>
                    {t("Senha inicial")}
                  </label>
                  <input id="f_senha" className={inputCls} type="password" value={values._senha} onChange={(e) => set("_senha", e.target.value)} autoComplete="new-password" aria-describedby="f_senha_dica" />
                  <div id="f_senha_dica" className="text-[11px] text-muted">
                    {t(SENHA_DICA)}
                  </div>
                </div>
              </div>
            )}
            <div className="text-[11px] text-muted">{t("O acesso é da pessoa: as próximas relações deste morador usam o mesmo login.")}</div>
          </>
        )}
      </div>
    </>
  );
}

function Toggle({ title, hint, on, onChange, wide }: { title?: string; hint?: string; on: boolean; onChange: () => void; wide?: boolean }) {
  return (
    <div className={cx("flex items-center justify-between gap-[18px] rounded-[10px] border border-line bg-surface px-3.5 py-[11px]", !wide && "max-w-[360px]")}>
      <span>
        <strong className="block text-[12.5px]">{title}</strong>
        {hint && <small className="text-[11px] text-muted">{hint}</small>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={title}
        onClick={onChange}
        className={cx("relative h-[22px] w-10 flex-none rounded-full border-0 transition-colors after:absolute after:top-[3px] after:size-4 after:rounded-full after:bg-white after:transition-[left] after:content-['']", on ? "bg-ok after:left-[21px]" : "bg-muted-2 after:left-[3px]")}
      />
    </div>
  );
}

function Field({ f, value, values, options, onChange }: { f: FieldDef; value: unknown; values: Rec; options: Option[]; onChange: (v: unknown) => void }) {
  useIdioma();
  const id = `f_${f.name}`;
  const grupo = f.type === "radio" || f.type === "checkbox-group" || f.type === "toggle";
  const label = (
    <>
      {t(f.label)}
      {f.required ? " *" : ""}
    </>
  );
  const wrap = (children: ReactNode) => (
    <div className={cx("flex flex-col gap-[7px]", !f.half && "col-span-full")}>
      {grupo ? (
        <div className={labelCls}>{label}</div>
      ) : (
        <label htmlFor={id} className={labelCls}>
          {label}
        </label>
      )}
      {children}
      {f.fkNote && <div className="text-[11px] text-muted">{t(f.fkNote)}</div>}
    </div>
  );

  switch (f.type) {
    case "toggle":
      return wrap(<Toggle title={f.toggleTitle && t(f.toggleTitle)} hint={f.toggleHint && t(f.toggleHint)} on={value === 1} onChange={() => onChange(value === 1 ? 0 : 1)} />);
    case "radio":
      return wrap(
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {options.map((o) => {
            const sel = value === o.value;
            // opção que não está disponível agora (ex.: relação que já existe): fica apagada, com o motivo na dica
            const motivo = !sel && f.optionDisabled ? f.optionDisabled(String(o.value), [], values) : null;
            return (
              <button
                key={String(o.value)}
                type="button"
                role="radio"
                aria-checked={sel}
                aria-disabled={motivo ? true : undefined}
                title={motivo ?? undefined}
                className={cx("rounded-[9px] border px-3.5 py-2 text-xs font-bold", sel ? "border-primary bg-soft-blue text-link" : "border-line bg-surface", motivo && "cursor-not-allowed opacity-45")}
                onClick={() => {
                  if (!motivo) onChange(o.value);
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>,
      );
    case "checkbox-group":
      return wrap(
        <CheckboxGroup
          id={id}
          value={Array.isArray(value) ? (value as string[]) : []}
          options={options}
          onChange={onChange}
          disabledReason={f.optionDisabled ? (o, sel) => f.optionDisabled!(o, sel, values) : undefined}
        />,
      );
    case "select":
      return wrap(
        <select id={id} className={inputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">{t("Selecione…")}</option>
          {options.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {t(o.label)}
            </option>
          ))}
        </select>,
      );
    case "data-br":
      return wrap(<DateInputBR id={id} value={String(value ?? "")} onChange={onChange} placeholder={f.placeholder} />);
    case "textarea":
      return wrap(<textarea id={id} className={cx(inputCls, "min-h-[84px] resize-y")} value={String(value ?? "")} placeholder={f.placeholder && t(f.placeholder)} onChange={(e) => onChange(e.target.value)} />);
    default: {
      const htmlType = f.type === "money" ? "text" : f.type;
      return wrap(
        <input
          id={id}
          className={inputCls}
          type={htmlType}
          inputMode={f.type === "money" ? "decimal" : undefined}
          value={String(value ?? "")}
          placeholder={f.placeholder && t(f.placeholder)}
          maxLength={f.maxLength}
          min={f.min}
          step={f.step}
          autoComplete={f.type === "password" ? "new-password" : "off"}
          onChange={(e) => onChange(e.target.value)}
        />,
      );
    }
  }
}
