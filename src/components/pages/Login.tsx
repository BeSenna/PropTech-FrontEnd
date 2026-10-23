"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthContext";
import { btn, ErrorBox, inputCls } from "@/components/ui";

const lbl = "text-[11.5px] font-bold text-ink-2";

export default function Login() {
  const { user, ready, login } = useAuth();
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const esperado = useRef<"SINDICO" | "MORADOR">("SINDICO");

  useEffect(() => {
    if (ready && user) router.replace(user.usuarioPerfil === "SINDICO" ? "/" : "/portal");
  }, [ready, user, router]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!usuario.trim() || !senha) return setErro("Informe login e senha.");
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
    <div className="grid min-h-screen place-items-center bg-linear-to-br from-navy via-[#1b2f70] to-primary p-4">
      <div className="w-full max-w-[430px] rounded-2xl bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <div className="flex items-center gap-2.5 pb-3.5">
          <div className="grid size-[38px] flex-none place-items-center rounded-[9px] bg-accent text-[15px] font-extrabold text-navy">PT</div>
          <div>
            <strong className="block text-sm text-navy">PropTech</strong>
            <small className="text-[10.5px] text-muted">condominio_moradores</small>
          </div>
        </div>
        <h1 className="m-0 mt-2 text-[22px] font-extrabold text-navy">Entrar no PropTech</h1>
        <p className="mt-1 mb-[18px] text-[12.5px] text-muted">Síndico(a) ou morador — use seu login para acessar sua área.</p>
        {erro && <ErrorBox>{erro}</ErrorBox>}
        <form onSubmit={enviar} className="grid gap-4">
          <div className="flex flex-col gap-[7px]">
            <label htmlFor="usuario" className={lbl}>
              Login · <span className="font-semibold">usuario_login</span>
            </label>
            <input id="usuario" className={inputCls} value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="seu.login" autoComplete="username" autoFocus />
          </div>
          <div className="flex flex-col gap-[7px]">
            <label htmlFor="senha" className={lbl}>
              Senha
            </label>
            <input id="senha" className={inputCls} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>
          <div className="grid gap-2.5 min-[420px]:grid-cols-2">
            <button type="submit" className={`${btn("outline")} justify-center`} disabled={busy} onClick={() => (esperado.current = "SINDICO")}>
              Entrar como Síndico(a)
            </button>
            <button type="submit" className={`${btn("primary")} justify-center`} disabled={busy} onClick={() => (esperado.current = "MORADOR")}>
              Entrar como Morador
            </button>
          </div>
        </form>
        <p className="mt-[18px] mb-0 text-center text-[11px] text-muted">
          Acesso exclusivo para moradores cadastrados pelo síndico.
          <br />
          Dúvidas? Fale com a administração do condomínio.
        </p>
      </div>
    </div>
  );
}
