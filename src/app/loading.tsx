// Mostrado pelo Next.js enquanto uma página está carregando (equivale ao loading.js do roteiro de aula).
export default function Carregando() {
  return (
    <div role="status" aria-live="polite" className="grid min-h-screen place-items-center p-6 text-muted">
      Carregando…
    </div>
  );
}
