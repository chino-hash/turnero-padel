import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import ClientSessionProvider from "../components/providers/ClientSessionProvider";
import ClientToaster from "../components/providers/ClientToaster";
import { ReactNode } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PADEL BOOK",
  description: "Sistema de reservas para canchas de pádel",
  applicationName: "PADEL BOOK",
  openGraph: {
    title: "PADEL BOOK",
    siteName: "PADEL BOOK",
  },
  twitter: {
    title: "PADEL BOOK",
    card: "summary",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}>
        <ClientSessionProvider>
          {children}
          <ClientToaster />
        </ClientSessionProvider>
      </body>
    </html>
  );
}
