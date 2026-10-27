"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { btn, Card, cx, ErrorBox, inputCls, Loading, PageHeader } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { limparCache } from "@/resources/api";
import type { FieldDef, Option, Rec, ResourceConfig } from "@/lib/types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const moneyToNumber = (s: unknown) => Number(String(s).replace(/\./g, "").replace(",", "."));
const moneyToText = (v: unknown) => (v === "" || v === null || v === undefined ? "" : String(v).replace(".", ","));

const labelCls = "text-[11.5px] font-bold text-ink-2";

export default function ResourceForm({ cfg, mode, id }: { cfg: ResourceConfig; mode: "create" | "edit"; id?: string }) {
  const router = useRouter();
  const toast = useToast();
  const sp = useSearchParams();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, mode, id]);

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
  }, [cfg]);

  const set = (name: string, v: unknown) => setValues((x) => ({ ...(x as Rec), [name]: v }));
  const optionsOf = (f: FieldDef) => f.options ?? opts[f.name] ?? [];

  const converter = (v: Rec): Rec => {
    const out: Rec = { ...v };
    for (const f of campos) {
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
    for (const f of campos) {
      const v = values[f.name];
      if (f.required && (v === "" || v === undefined || v === null)) {
        setErro(`Preencha o campo "${f.label}".`);
        return;
      }
      const msg = f.validate && v !== "" && v !== undefined && v !== null ? f.validate(v) : null;
      if (msg) {
        setErro(msg);
        return;
      }
    }
    if (cfg.extraFormSection === "vinculoAcesso" && mode === "create" && values._acesso) {
      if (!String(values._login).trim()) return setErro("Informe o login de acesso.");
      if (String(values._senha).length < 8) return setErro("A senha deve ter pelo menos 8 caracteres.");
    }
    if (values.moradorImovelDataFim && values.moradorImovelDataInicio && values.moradorImovelDataFim < values.moradorImovelDataInicio) {
      return setErro("O fim da relação não pode ser anterior ao início.");
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
        toast(`${cap(cfg.singular)} salv${cfg.gender === "m" ? "o" : "a"}, mas a etapa extra falhou: ${(e2 as Error).message}`, "erro");
        router.push(cfg.path);
        return;
      }
      limparCache();
      toast(`${cap(cfg.singular)} ${mode === "create" ? "criad" : "atualizad"}${cfg.gender === "m" ? "o" : "a"} com sucesso.`);
      router.push(mode === "edit" && cfg.hasDetail ? `${cfg.path}/${id}` : cfg.path);
    } catch (e3) {
      setErro((e3 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const titulo = `${mode === "edit" ? "Editar" : cfg.gender === "m" ? "Novo" : "Nova"} ${cap(cfg.singular)}`;
  if (!values) return erro ? <ErrorBox>{erro}</ErrorBox> : <Loading />;

  return (
    <>
      <PageHeader title={titulo} sub={mode === "edit" && row ? cfg.idLabel(row) : cfg.endpoint.replace("GET", "POST")} />
      <form onSubmit={enviar} noValidate>
        <Card className="max-w-[760px]">
          <header className="border-b border-line-soft px-5 py-4">
            <h3 className="m-0 text-sm font-bold">{cfg.formTitle ?? `Dados d${cfg.gender === "m" ? "o" : "a"} ${cfg.singular}`}</h3>
            <p className="mt-[3px] mb-0 text-xs text-muted">{cfg.formSubtitle}</p>
          </header>
          {erro && (
            <div className="mx-[26px] mt-3.5">
              <ErrorBox>{erro}</ErrorBox>
            </div>
          )}
          <div className="grid grid-cols-1 gap-x-5 gap-y-[18px] px-[26px] pt-[22px] pb-2 min-[820px]:grid-cols-2">
            {campos.map((f) => (
              <Field key={f.name} f={f} value={values[f.name]} options={optionsOf(f)} onChange={(v) => set(f.name, v)} />
            ))}

            {cfg.extraFormSection === "vinculoAcesso" && (
              <div className="col-span-full grid gap-3 rounded-[10px] border border-dashed border-side-muted bg-[#f8f9fd] px-4 py-3.5">
                <div className="text-[11.5px] font-bold">
                  Acesso ao sistema · <span className="font-semibold text-ink-2">usuario_id (FK opcional em morador_imovel)</span>
                </div>
                {mode === "edit" ? (
                  <div className="text-[11px] text-muted">
                    {values._usuarioId ? `Esta relação já tem acesso (usuario_id #${values._usuarioId}). Gerencie a conta em Usuários.` : "Esta relação não tem acesso ao Portal do Morador. Crie a conta em Usuários."}
                  </div>
                ) : (
                  <>
                    <Toggle title="Conceder acesso ao Portal do Morador" hint="Cria uma conta de login vinculada a esta relação" on={!!values._acesso} onChange={() => set("_acesso", !values._acesso)} wide />
                    {values._acesso && (
                      <div className="grid grid-cols-1 gap-3 min-[820px]:grid-cols-2">
                        <div className="flex flex-col gap-[7px]">
                          <label htmlFor="f_login" className={labelCls}>
                            Login · usuario_login
                          </label>
                          <input id="f_login" className={inputCls} value={values._login} maxLength={100} onChange={(e) => set("_login", e.target.value)} placeholder="seu.login" autoComplete="off" />
                        </div>
                        <div className="flex flex-col gap-[7px]">
                          <label htmlFor="f_senha" className={labelCls}>
                            Senha inicial (mín. 8)
                          </label>
                          <input id="f_senha" className={inputCls} type="password" value={values._senha} onChange={(e) => set("_senha", e.target.value)} autoComplete="new-password" />
                        </div>
                      </div>
                    )}
                    <div className="text-[11px] text-muted">⚑ usuario_id fica em morador_imovel, não em morador — cada vínculo pode ter sua própria conta.</div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-2.5 border-t border-line-soft px-[26px] pt-[18px] pb-6">
            <button type="button" className={btn("ghost")} onClick={() => router.back()}>
              Cancelar
            </button>
            <button type="submit" className={btn("primary")} disabled={busy}>
              {busy ? "Salvando…" : `Salvar ${cfg.singular}`}
            </button>
          </div>
        </Card>
      </form>
    </>
  );
}

function Toggle({ title, hint, on, onChange, wide }: { title?: string; hint?: string; on: boolean; onChange: () => void; wide?: boolean }) {
  return (
    <div className={cx("flex items-center justify-between gap-[18px] rounded-[10px] border border-line bg-white px-3.5 py-[11px]", !wide && "max-w-[360px]")}>
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

function Field({ f, value, options, onChange }: { f: FieldDef; value: unknown; options: Option[]; onChange: (v: unknown) => void }) {
  const id = `f_${f.name}`;
  const grupo = f.type === "radio" || f.type === "toggle";
  const label = (
    <>
      {f.label}
      {f.required ? " *" : ""} · <span className="font-semibold text-ink-2">{f.col}</span>
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
      {f.fkNote && <div className="text-[11px] text-muted">{f.fkNote}</div>}
    </div>
  );

  switch (f.type) {
    case "toggle":
      return wrap(<Toggle title={f.toggleTitle} hint={f.toggleHint} on={value === 1} onChange={() => onChange(value === 1 ? 0 : 1)} />);
    case "radio":
      return wrap(
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {options.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={value === o.value}
              className={cx("rounded-[9px] border px-3.5 py-2 text-xs font-bold", value === o.value ? "border-primary bg-soft-blue text-primary" : "border-line bg-white")}
              onClick={() => onChange(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>,
      );
    case "select":
      return wrap(
        <select id={id} className={inputCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">Selecione…</option>
          {options.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>,
      );
    case "textarea":
      return wrap(<textarea id={id} className={cx(inputCls, "min-h-[84px] resize-y")} value={String(value ?? "")} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />);
    default: {
      const htmlType = f.type === "money" ? "text" : f.type;
      return wrap(
        <input
          id={id}
          className={inputCls}
          type={htmlType}
          inputMode={f.type === "money" ? "decimal" : undefined}
          value={String(value ?? "")}
          placeholder={f.placeholder}
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
