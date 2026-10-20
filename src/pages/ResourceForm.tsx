import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, ErrorBox, Loading, PageHeader } from '../components/ui';
import { useToast } from '../components/Toast';
import { limparCache } from '../resources/api';
import type { FieldDef, Option, Rec, ResourceConfig } from '../lib/types';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const moneyToNumber = (s: unknown) => Number(String(s).replace(/\./g, '').replace(',', '.'));
const moneyToText = (v: unknown) => (v === '' || v === null || v === undefined ? '' : String(v).replace('.', ','));

export default function ResourceForm({ cfg, mode }: { cfg: ResourceConfig; mode: 'create' | 'edit' }) {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [sp] = useSearchParams();
  const [values, setValues] = useState<Rec | null>(null);
  const [row, setRow] = useState<Rec | null>(null);
  const [opts, setOpts] = useState<Record<string, Option[]>>({});
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);

  const campos = useMemo(() => cfg.fields.filter((f) => !f.mode || f.mode === mode), [cfg, mode]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        if (mode === 'edit') {
          const r = await cfg.adapter.get(id!);
          if (!vivo) return;
          setRow(r);
          const v = cfg.toForm(r);
          // máscara de dinheiro no campo
          for (const f of cfg.fields) if (f.type === 'money') v[f.name] = moneyToText(v[f.name]);
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
      if (f.type === 'number') out[f.name] = raw === '' || raw === undefined ? '' : Number(raw);
      else if (f.type === 'money') out[f.name] = raw === '' || raw === undefined ? '' : moneyToNumber(raw);
      else if (f.loadOptions || f.type === 'select') {
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
    setErro('');
    for (const f of campos) {
      const v = values[f.name];
      if (f.required && (v === '' || v === undefined || v === null)) {
        setErro(`Preencha o campo "${f.label}".`);
        return;
      }
    }
    if (cfg.extraFormSection === 'vinculoAcesso' && mode === 'create' && values._acesso) {
      if (!String(values._login).trim()) return setErro('Informe o login de acesso.');
      if (String(values._senha).length < 8) return setErro('A senha deve ter pelo menos 8 caracteres.');
    }
    if (values.moradorImovelDataFim && values.moradorImovelDataInicio && values.moradorImovelDataFim < values.moradorImovelDataInicio) {
      return setErro('O fim da relação não pode ser anterior ao início.');
    }
    setBusy(true);
    try {
      const v = converter(values);
      const payload = cfg.toPayload(v, mode);
      const saved = mode === 'create' ? await cfg.adapter.create(payload) : await cfg.adapter.update(id!, payload);
      try {
        await cfg.afterSave?.(saved, v, mode);
      } catch (e2) {
        limparCache();
        toast(`${cap(cfg.singular)} salv${cfg.gender === 'm' ? 'o' : 'a'}, mas a etapa extra falhou: ${(e2 as Error).message}`, 'erro');
        nav(cfg.path);
        return;
      }
      limparCache();
      toast(`${cap(cfg.singular)} ${mode === 'create' ? 'criad' : 'atualizad'}${cfg.gender === 'm' ? 'o' : 'a'} com sucesso.`);
      nav(mode === 'edit' && cfg.hasDetail ? `${cfg.path}/${id}` : cfg.path);
    } catch (e3) {
      setErro((e3 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const titulo = `${mode === 'edit' ? 'Editar' : cfg.gender === 'm' ? 'Novo' : 'Nova'} ${cap(cfg.singular)}`;
  if (!values) return erro ? <ErrorBox>{erro}</ErrorBox> : <Loading />;

  return (
    <>
      <PageHeader title={titulo} sub={mode === 'edit' && row ? cfg.idLabel(row) : cfg.endpoint.replace('GET', 'POST')} />
      <form onSubmit={enviar} noValidate>
        <Card className="form-card">
          <header className="card-head" style={{ display: 'block' }}>
            <h3>{cfg.formTitle ?? `Dados d${cfg.gender === 'm' ? 'o' : 'a'} ${cfg.singular}`}</h3>
            <p>{cfg.formSubtitle}</p>
          </header>
          {erro && (
            <div className="err-inline">
              <ErrorBox>{erro}</ErrorBox>
            </div>
          )}
          <div className="form-body">
            {campos.map((f) => (
              <Field key={f.name} f={f} value={values[f.name]} options={optionsOf(f)} onChange={(v) => set(f.name, v)} />
            ))}

            {cfg.extraFormSection === 'vinculoAcesso' && (
              <div className="access-box">
                <div className="lbl" style={{ fontWeight: 700, fontSize: 11.5 }}>
                  Acesso ao sistema · <span className="col">usuario_id (FK opcional em morador_imovel)</span>
                </div>
                {mode === 'edit' ? (
                  <div className="fk-note">
                    {values._usuarioId ? `Esta relação já tem acesso (usuario_id #${values._usuarioId}). Gerencie a conta em Usuários.` : 'Esta relação não tem acesso ao Portal do Morador. Crie a conta em Usuários.'}
                  </div>
                ) : (
                  <>
                    <div className="toggle-box" style={{ maxWidth: 'none' }}>
                      <span>
                        <strong>Conceder acesso ao Portal do Morador</strong>
                        <small>Cria uma conta de login vinculada a esta relação</small>
                      </span>
                      <button type="button" role="switch" aria-checked={!!values._acesso} aria-label="Conceder acesso" className={`switch ${values._acesso ? 'on' : ''}`} onClick={() => set('_acesso', !values._acesso)} />
                    </div>
                    {values._acesso && (
                      <div className="two">
                        <div className="field">
                          <label htmlFor="f_login">Login · usuario_login</label>
                          <input id="f_login" className="input" value={values._login} maxLength={100} onChange={(e) => set('_login', e.target.value)} placeholder="seu.login" autoComplete="off" />
                        </div>
                        <div className="field">
                          <label htmlFor="f_senha">Senha inicial (mín. 8)</label>
                          <input id="f_senha" className="input" type="password" value={values._senha} onChange={(e) => set('_senha', e.target.value)} autoComplete="new-password" />
                        </div>
                      </div>
                    )}
                    <div className="fk-note">⚑ usuario_id fica em morador_imovel, não em morador — cada vínculo pode ter sua própria conta.</div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => nav(-1)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Salvando…' : `Salvar ${cfg.singular}`}
            </button>
          </div>
        </Card>
      </form>
    </>
  );
}

function Field({ f, value, options, onChange }: { f: FieldDef; value: unknown; options: Option[]; onChange: (v: unknown) => void }) {
  const id = `f_${f.name}`;
  const label = (
    <label htmlFor={f.type === 'radio' || f.type === 'toggle' ? undefined : id}>
      {f.label}
      {f.required ? ' *' : ''} · <span className="col">{f.col}</span>
    </label>
  );
  const wrap = (children: React.ReactNode) => (
    <div className={`field ${f.half ? 'half' : ''}`}>
      {f.type === 'radio' || f.type === 'toggle' ? <div className="lbl">{label}</div> : label}
      {children}
      {f.fkNote && <div className="fk-note">{f.fkNote}</div>}
    </div>
  );

  switch (f.type) {
    case 'toggle':
      return wrap(
        <div className="toggle-box">
          <span>
            <strong>{f.toggleTitle}</strong>
            {f.toggleHint && <small>{f.toggleHint}</small>}
          </span>
          <button type="button" role="switch" aria-checked={value === 1} aria-label={f.toggleTitle} className={`switch ${value === 1 ? 'on' : ''}`} onClick={() => onChange(value === 1 ? 0 : 1)} />
        </div>,
      );
    case 'radio':
      return wrap(
        <div className="radios" role="radiogroup">
          {options.map((o) => (
            <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value} className={`radio ${value === o.value ? 'on' : ''}`} onClick={() => onChange(o.value)}>
              {o.label}
            </button>
          ))}
        </div>,
      );
    case 'select':
      return wrap(
        <select id={id} className="input" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">Selecione…</option>
          {options.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>,
      );
    case 'textarea':
      return wrap(<textarea id={id} className="input" value={String(value ?? '')} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />);
    default: {
      const htmlType = f.type === 'money' ? 'text' : f.type;
      return wrap(
        <input
          id={id}
          className="input"
          type={htmlType}
          inputMode={f.type === 'money' ? 'decimal' : undefined}
          value={String(value ?? '')}
          placeholder={f.placeholder}
          maxLength={f.maxLength}
          min={f.min}
          step={f.step}
          autoComplete={f.type === 'password' ? 'new-password' : 'off'}
          onChange={(e) => onChange(e.target.value)}
        />,
      );
    }
  }
}
