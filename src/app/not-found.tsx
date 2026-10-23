import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1 className="m-0 text-[22px] font-extrabold text-navy">Página não encontrada</h1>
        <p className="mt-1 mb-4 text-muted">O endereço não existe neste sistema.</p>
        <Link href="/" className="rounded-[9px] bg-primary px-4 py-[9px] text-[12.5px] font-bold text-white">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
