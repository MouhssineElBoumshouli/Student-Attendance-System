import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#111827",
};

export const metadata: Metadata = {
  title: "UEMF Présence - Système de gestion des présences",
  description:
    "Plateforme de gestion des présences par QR code pour l'Université Euro-Méditerranéenne de Fès",
  manifest: undefined,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UEMF Présence",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <body className="h-full font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
