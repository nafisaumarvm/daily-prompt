import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Figtree } from "next/font/google";
import { Header } from "@/app/components/Header";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Daily Prompt — Wedding LED Questions",
  description:
    "Push a romantic daily question to your Ulanzi TC001 / AWTRIX bedside display.",
  applicationName: "Daily Prompt",
};

export const viewport: Viewport = {
  themeColor: "#e85a7a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="relative antialiased">
        <div className="relative z-10 min-h-screen">
          <Header />
          <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
