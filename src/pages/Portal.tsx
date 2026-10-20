import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Card, Empty, ErrorBox, PageHeader, StatCard } from '../components/ui';
import { useToast } from '../components/Toast';
import { competenciaTxt, fmtDate, fmtMoney } from '../lib/format';
import { avisoStore, cobrancaStore, ocorrenciaStore, reservaStore, areaStore } from '../mock/data';
import { usePortal } from './Layouts';
import type { Rec } from '../lib/types';

const horario = (r: Rec) => `${String(r.reserva_horario_inicio).slice(0, 2).replace(/^0/, '')}h–${String(r.reserva_horario_fim).slice(0, 2).replace(/^0/, '')}h`;
const agora = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const primeiroNome = (n: string) => n.split(' ').slice(0, 2).join(' ');

function Item({ ico, tint, title, sub, right, to }: { ico: string; tint: string; title: string; sub: string; right?: ReactNode; to?: string }) {
  const body = (
    <>
      <span className="rel-ico" style={{ background: tint }}>
        {ico}
      </span>
      <span className="grow">
        <strong>{title}</strong>
        <small>{sub}</small>
      </span>
      {right}
    </>
  );
  return to ? (
    <Link to={to} className="row-item">
      {body}
    </Link>
  ) : (
    <div className="row-item">{body}</div>
  );
}

const minhasReservas = (id: number) => reservaStore.all().filter((r) => r.reserva_morador_id === id);
const minhasOcorrencias = (id: number) => ocorrenciaStore.all().filter((r) => r.ocorrencia_morador_id === id);
const avisosAtivos = () => avisoStore.all().filter((a) => a.avisos_status === 1);

export function PortalHome() {
  const p = usePortal();
  const reservas = minhasReservas(p.moradorId).filter((r) => r.reserva_status === 1);
  const ocs = minhasOcorrencias(p.moradorId).filter((o) => o.ocorrencia_tipo === 'EM_ANDAMENTO');
  const avisos = avisosAtivos();
  return (
    <>
      <PageHeader
        back={false}
        title={`Olá, ${primeiroNome(p.nome)} 👋`}
        sub={`${p.imovelLabel ? `${p.imovelLabel} · ${p.blocoNome}` : 'Sem imóvel vinculado'} — bem-vindo(a) ao seu portal.`}
        actions={
          <>
            <Link className="btn btn-outline" to="/portal/reservas/nova">
              + Nova reserva
            </Link>
            <Link className="btn btn-amber" to="/portal/ocorrencias/nova">
              + Abrir ocorrência
            </Link>
          </>
        }
      />
      <div className="stats">
        <StatCard value={p.vinculo ? 1 : 0} label="Imóvel vinculado" color="navy" />
        <StatCard value={reservas.length} label="Reservas ativas" color="green" />
        <StatCard value={ocs.length} label="Ocorrência em andamento" color="amber" />
        <StatCard value={avisos.length} label="Avisos ativos" color="pink" />
      </div>
      <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card title="Minhas próximas reservas" className="list-card">
          {reservas.length === 0 && <Empty>Nenhuma reserva ativa.</Empty>}
          {reservas.slice(0, 4).map((r) => (
            <Item key={r.id} ico="📅" tint="#ede9fe" title={r.area_comum_label} sub={`${fmtDate(r.reserva_data_reserva)} · ${horario(r)}`} right={<Badge>{r.reserva_tipo}</Badge>} />
          ))}
        </Card>
        <Card title="Avisos recentes" className="list-card">
          {avisos.length === 0 && <Empty>Nenhum aviso.</Empty>}
          {avisos.slice(0, 4).map((a) => (
            <Item key={a.id} ico="📢" tint="#e0f2fe" title={a.avisos_titulo} sub={fmtDate(a.avisos_data_publicacao)} />
          ))}
        </Card>
      </div>
    </>
  );
}

export function PortalImovel() {
  const p = usePortal();
  const v = p.vinculo;
  const im = v?.imovel;
  const outros = useMemo(() => [] as Rec[], []);
  void outros;
  return (
    <>
      <PageHeader title="Meu Imóvel" sub="Dados do imóvel vinculado à sua conta." />
      {!v ? (
        <Card>
          <Empty>Você ainda não tem imóvel vinculado.</Empty>
        </Card>
      ) : (
        <>
          <div className="hero hero-green">
            <div>
              <small className="kind">MEU IMÓVEL</small>
              <h2>
                {p.imovelLabel} · {p.blocoNome}
              </h2>
              <div className="badges">
                <span>{v.moradorImovelTipoRelacao}</span>
              </div>
            </div>
          </div>
          <div className="detail-grid">
            <Card title="Dados do imóvel">
              {[
                ['imovel_numero', im?.imovelNumero],
                ['imovel_andar', im?.imovelAndar ?? '—'],
                ['bloco_id', p.blocoNome],
                ['imovel_tipo', im?.imovelTipo],
                ['imovel_area_m2', im?.imovelAreaM2 ? `${Number(im.imovelAreaM2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m²` : '—'],
                ['imovel_garagem', im?.imovelGaragem ?? '—'],
              ].map(([k, val]) => (
                <div className="kv" key={String(k)}>
                  <span>{k}</span>
                  <b>{String(val ?? '—')}</b>
                </div>
              ))}
            </Card>
            <Card title="Sua relação">
              <div className="kv">
                <span>tipo</span>
                <b>
                  {v.moradorImovelTipoRelacao} · desde {fmtDate(v.moradorImovelDataInicio)}
                </b>
              </div>
              <div className="kv">
                <span>fim</span>
                <b>{fmtDate(v.moradorImovelDataFim)}</b>
              </div>
            </Card>
          </div>
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
          <Link className="btn btn-primary" to="/portal/reservas/nova">
            + Nova reserva
          </Link>
        }
      />
      <Card title="Reservas" count={rs.length} className="list-card">
        {rs.length === 0 && <Empty>Você ainda não fez reservas.</Empty>}
        {rs.map((r) => (
          <Item key={r.id} ico="📅" tint="#ede9fe" title={r.area_comum_label} sub={`${fmtDate(r.reserva_data_reserva)} · ${horario(r)}`} right={<Badge>{r.reserva_tipo}</Badge>} />
        ))}
      </Card>
    </>
  );
}

function useFormState<T extends Rec>(inicial: T) {
  const [v, setV] = useState<T>(inicial);
  return [v, (k: keyof T, val: unknown) => setV((x) => ({ ...x, [k]: val })) as unknown, v] as const;
}

export function PortalNovaReserva() {
  const p = usePortal();
  const nav = useNavigate();
  const toast = useToast();
  const areas = areaStore.all().filter((a) => a.area_comum_status === 1);
  const [v, set] = useFormState({ area: String(areas[0]?.id ?? ''), data: '', ini: '', fim: '' });
  const [erro, setErro] = useState('');
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const a = areas.find((x) => String(x.id) === v.area);
    if (!a || !v.data || !v.ini || !v.fim) return setErro('Preencha todos os campos.');
    if (v.fim <= v.ini) return setErro('O horário final deve ser depois do inicial.');
    const conflito = reservaStore.all().some((r) => r.area_comum_id === a.id && r.reserva_status === 1 && r.reserva_data_reserva === v.data && r.reserva_horario_inicio < v.fim && r.reserva_horario_fim > v.ini);
    if (conflito) return setErro('Já existe uma reserva nesse horário para esta área.');
    await reservaStore.create({ area_comum_id: a.id, area_comum_label: a.area_comum_nome, reserva_morador_id: p.moradorId, morador_nome: p.nome, reserva_data_reserva: v.data, reserva_horario_inicio: v.ini, reserva_horario_fim: v.fim, reserva_tipo: 'PENDENTE', reserva_status: 1 });
    toast('Reserva solicitada. O síndico irá confirmar.');
    nav('/portal/reservas');
  };
  return (
    <>
      <PageHeader title="Nova Reserva" sub="reserva" />
      <form onSubmit={enviar} noValidate>
        <Card title="Dados da reserva" className="form-card">
          {erro && (
            <div className="err-inline">
              <ErrorBox>{erro}</ErrorBox>
            </div>
          )}
          <div className="form-body">
            <div className="field">
              <label htmlFor="a">Área comum · area_comum_id</label>
              <select id="a" className="input" value={v.area} onChange={(e) => set('area', e.target.value)}>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.area_comum_nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="d">Data da reserva · reserva_data_reserva</label>
              <input id="d" type="date" className="input" value={v.data} onChange={(e) => set('data', e.target.value)} />
            </div>
            <div className="field half">
              <label htmlFor="i">Horário início</label>
              <input id="i" type="time" className="input" value={v.ini} onChange={(e) => set('ini', e.target.value)} />
            </div>
            <div className="field half">
              <label htmlFor="f">Horário fim</label>
              <input id="f" type="time" className="input" value={v.fim} onChange={(e) => set('fim', e.target.value)} />
            </div>
            <div className="auto-note">🔒 reserva_morador_id é preenchido automaticamente com base no seu login — você não escolhe outro morador.</div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => nav(-1)}>
              Cancelar
            </button>
            <button className="btn btn-primary">Solicitar reserva</button>
          </div>
        </Card>
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
          <Link className="btn btn-amber" to="/portal/ocorrencias/nova">
            + Abrir ocorrência
          </Link>
        }
      />
      <Card title="Ocorrências" count={os.length} className="list-card">
        {os.length === 0 && <Empty>Você ainda não abriu ocorrências.</Empty>}
        {os.map((o) => (
          <Item key={o.id} ico="⚠️" tint="#fef3c7" title={o.ocorrencia_titulo} sub={fmtDate(o.ocorrencia_data_ocorrencia)} right={<Badge>{o.ocorrencia_tipo}</Badge>} />
        ))}
      </Card>
    </>
  );
}

export function PortalNovaOcorrencia() {
  const p = usePortal();
  const nav = useNavigate();
  const toast = useToast();
  const [v, set] = useFormState({ titulo: '', desc: '' });
  const [erro, setErro] = useState('');
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!v.titulo.trim() || !v.desc.trim()) return setErro('Preencha título e descrição.');
    await ocorrenciaStore.create({ ocorrencia_morador_id: p.moradorId, morador_nome: p.nome, ocorrencia_titulo: v.titulo.trim(), ocorrencia_descricao: v.desc.trim(), ocorrencia_data_ocorrencia: agora(), ocorrencia_tipo: 'ABERTA', ocorrencia_status: 1 });
    toast('Ocorrência enviada ao síndico.');
    nav('/portal/ocorrencias');
  };
  return (
    <>
      <PageHeader title="Abrir Ocorrência" sub="ocorrencia" />
      <form onSubmit={enviar} noValidate>
        <Card title="Descreva o problema" className="form-card">
          {erro && (
            <div className="err-inline">
              <ErrorBox>{erro}</ErrorBox>
            </div>
          )}
          <div className="form-body">
            <div className="field">
              <label htmlFor="t">Título · ocorrencia_titulo</label>
              <input id="t" className="input" value={v.titulo} placeholder="Ex.: Vazamento no teto da garagem" onChange={(e) => set('titulo', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="ds">Descrição · ocorrencia_descricao</label>
              <textarea id="ds" className="input" value={v.desc} placeholder="Descreva com detalhes o que está acontecendo" onChange={(e) => set('desc', e.target.value)} />
            </div>
            <div className="auto-note">🔒 ocorrencia_morador_id é preenchido automaticamente com base no seu login.</div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => nav(-1)}>
              Cancelar
            </button>
            <button className="btn btn-primary">Enviar ocorrência</button>
          </div>
        </Card>
      </form>
    </>
  );
}

export function PortalAvisos() {
  const as = avisosAtivos();
  return (
    <>
      <PageHeader title="Avisos" sub="Comunicados do síndico para os moradores." />
      <Card title="Avisos ativos" count={as.length} className="list-card">
        {as.length === 0 && <Empty>Nenhum aviso ativo.</Empty>}
        {as.map((a) => (
          <Item key={a.id} ico="📢" tint="#e0f2fe" title={a.avisos_titulo} sub={`Publicado em ${fmtDate(a.avisos_data_publicacao)}${a.avisos_data_expiracao ? ` · expira em ${fmtDate(a.avisos_data_expiracao)}` : ''}`} />
        ))}
      </Card>
    </>
  );
}

const minhasCobrancas = (imovelId: number | null) => (imovelId ? cobrancaStore.all().filter((c) => c.imovel_id === imovelId && c.cobranca_status === 1) : []);
const comp = (iso: string) => {
  const t = competenciaTxt(iso);
  const meses: Record<string, string> = { Jan: 'Janeiro', Fev: 'Fevereiro', Mar: 'Março', Abr: 'Abril', Mai: 'Maio', Jun: 'Junho', Jul: 'Julho', Ago: 'Agosto', Set: 'Setembro', Out: 'Outubro', Nov: 'Novembro', Dez: 'Dezembro' };
  const [m, a] = t.split('/');
  return `${meses[m!] ?? m}/${a}`;
};

export function PortalCobrancas() {
  const p = usePortal();
  const cs = minhasCobrancas(p.imovelId);
  return (
    <>
      <PageHeader title="Minhas Cobranças" sub={`Cobranças do seu imóvel · ${p.imovelLabel || '—'}${p.blocoNome ? `, ${p.blocoNome}` : ''}.`} />
      <Card title="Cobranças" count={cs.length} className="list-card">
        {cs.length === 0 && <Empty>Nenhuma cobrança encontrada.</Empty>}
        {cs.map((c) => (
          <Item key={c.id} to={`/portal/cobrancas/${c.id}`} ico="🧾" tint="#cffafe" title={`${comp(c.cobranca_competencia)} · ${fmtMoney(c.cobranca_valor)}`} sub={`${c.cobranca_tipo === 'PAGO' ? 'Pago' : c.cobranca_tipo === 'VENCIDO' ? 'Venceu' : 'Vence'} em ${fmtDate(c.cobranca_vencimento)}`} right={<Badge>{c.cobranca_tipo}</Badge>} />
        ))}
      </Card>
    </>
  );
}

export function PortalCobranca() {
  const p = usePortal();
  const { id } = useParams();
  const c = minhasCobrancas(p.imovelId).find((x) => String(x.id) === id);
  if (!c) return <ErrorBox>Cobrança não encontrada.</ErrorBox>;
  return (
    <>
      <PageHeader title={`Cobrança · ${comp(c.cobranca_competencia)}`} sub={`${p.imovelLabel} · ${p.blocoNome}`} />
      <div className="hero hero-navy">
        <div>
          <small className="kind">COBRANÇA</small>
          <h2>{fmtMoney(c.cobranca_valor)}</h2>
          <div className="badges">
            <span>{c.cobranca_tipo}</span>
          </div>
        </div>
        <button type="button" className="btn btn-white" onClick={() => window.print()}>
          Baixar boleto (PDF)
        </button>
      </div>
      <div className="detail-grid">
        <Card title="Dados da cobrança">
          {[
            ['cobranca_descricao', c.cobranca_descricao],
            ['cobranca_competencia', fmtDate(c.cobranca_competencia)],
            ['cobranca_vencimento', fmtDate(c.cobranca_vencimento)],
            ['cobranca_tipo', c.cobranca_tipo],
          ].map(([k, v]) => (
            <div className="kv" key={k}>
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </Card>
        <Card title="Boleto">
          <div className="kv">
            <span>boleto_linha_digitavel</span>
            <b>{c.boleto_linha_digitavel}</b>
          </div>
          <div className="kv">
            <span>boleto_data_emissao</span>
            <b>{fmtDate(c.boleto_data_emissao)}</b>
          </div>
        </Card>
      </div>
    </>
  );
}
