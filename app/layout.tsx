import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/contexts/ThemeContext";
import SwRegister from "./sw-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema Financeiro Pessoal",
  description: "Controle financeiro pessoal minimalista e funcional",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Sistema Financeiro Pessoal",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b62ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Tenta carregar tema do JSON (bloqueante para evitar flash)
                  const xhr = new XMLHttpRequest();
                  xhr.open('GET', '/data/configuracoes.json', false); // síncrono
                  xhr.send();
                  
                  if (xhr.status === 200) {
                    const config = JSON.parse(xhr.responseText);
                    let tema = config.tema || 'light';
                    
                    // Resolve 'system' para light ou dark
                    if (tema === 'system') {
                      tema = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                    
                    // Remove ambas as classes primeiro
                    document.documentElement.classList.remove('light', 'dark');
                    // Aplica o tema correto
                    document.documentElement.classList.add(tema);
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <SwRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
