import "./globals.css";

export const metadata = {
  title: "MELS — Fermentos & Botánicos. Dos colonias vivas, un solo cultivo.",
  description:
    "Kombucha, miel y hierbas de origen verificado, fermentadas en Monterrey en lotes pequeños y numerados.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
