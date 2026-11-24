import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

// Aplica o tema salvo (ou o do sistema) antes da primeira pintura, para não piscar o claro.
const TEMA_INICIAL = `try{var t=localStorage.getItem("proptech-tema");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

// Idioma salvo (pt-BR por padrão): vai para o atributo lang do <html> antes da primeira pintura.
const IDIOMA_INICIAL = `try{document.documentElement.lang=localStorage.getItem("proptech-idioma")==="en"?"en":"pt-BR"}catch(e){}`;

export const metadata: Metadata = {
  title: "PropTech · Moradores",
  description: "Gestão de condomínio — módulo Moradores",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL + IDIOMA_INICIAL }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router: o layout raiz vale para todas as páginas */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
