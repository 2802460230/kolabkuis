import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "KolabKuis — bank soal kolaboratif", template: "%s | KolabKuis" },
  description: "Tulis soal bersama teman sekelas, saling nilai kualitasnya, lalu latihan lewat kuis interaktif.",
};
export const viewport: Viewport = { themeColor: "#172340", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
