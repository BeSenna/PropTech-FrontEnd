import { useRef, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ErrorBox } from '../components/ui';

export default function Login() {
  const { user, login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);
  const esperado = useRef<'SINDICO' | 'MORADOR'>('SINDICO');

  if (user) return <Navigate to={user.usuarioPerfil === 'SINDICO' ? '/' : '/portal'} replace />;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!usuario.trim() || !senha) return setErro('Informe login e senha.');
    setBusy(true);
    try {
      await login(usuario.trim(), senha, esperado.current);
    } catch (e2) {
      setErro((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="brand">
          <div className="logo lg">PT</div>
          <div>
            <strong>PropTech</strong>
            <small>condominio_moradores</small>
          </div>
        </div>
        <h1>Entrar no PropTech</h1>
        <p className="lead">Síndico(a) ou morador — use seu login para acessar sua área.</p>
        {erro && <ErrorBox>{erro}</ErrorBox>}
        <form onSubmit={enviar}>
          <div className="field">
            <label htmlFor="usuario">
              Login · <span className="col">usuario_login</span>
            </label>
            <input id="usuario" className="input" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="seu.login" autoComplete="username" autoFocus />
          </div>
          <div className="field">
            <label htmlFor="senha">Senha</label>
            <input id="senha" className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>
          <div className="btns">
            <button type="submit" className="btn btn-outline" disabled={busy} onClick={() => (esperado.current = 'SINDICO')}>
              Entrar como Síndico(a)
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy} onClick={() => (esperado.current = 'MORADOR')}>
              Entrar como Morador
            </button>
          </div>
        </form>
        <p className="legal">
          Acesso exclusivo para moradores cadastrados pelo síndico.
          <br />
          Dúvidas? Fale com a administração do condomínio.
        </p>
      </div>
    </div>
  );
}
