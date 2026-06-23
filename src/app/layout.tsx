import type { Metadata, Viewport } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CNE · Control de Asistencia",
  description:
    "Control de asistencia — Declaración de Presidente Electo · Consejo Nacional Electoral de Colombia.",
};

export const viewport: Viewport = {
  themeColor: "#070c1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${poppins.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {/* Franja tricolor institucional, fija en el borde superior */}
        <div
          aria-hidden
          className="flag-bar fixed inset-x-0 top-0 z-[60] h-1.5"
        />
        {children}
      </body>
    </html>
  );
}
