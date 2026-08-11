import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProjetoX Produções | Ingressos para Festas e Eventos",
  description: "Plataforma oficial de venda de ingressos para festas, baladas e eventos noturnos com QR Code de uso único.",
  openGraph: {
    title: "ProjetoX Produções | Ingressos para Festas e Eventos",
    description: "Garanta seu ingresso antecipado com QR Code imediato.",
    siteName: "ProjetoX Produções",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="bg-brandDark text-gray-100 font-sans selection:bg-pink-500 selection:text-white min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
