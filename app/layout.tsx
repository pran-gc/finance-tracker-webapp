import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// FontAwesome global setup (prevent auto CSS insertion by the library)
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false
import { ThemeProvider } from "next-themes";
import "./globals.css";
import AutoSyncClient from '@/components/auto-sync-client'
import AuthGate from '@/components/auth-gate'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Track your finances locally and sync with Google Drive",
  manifest: "/manifest.json",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#18181b' },
    { media: '(prefers-color-scheme: light)', color: '#f4f4f5' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Finance Tracker',
  },
  icons: {
    icon: '/images/favicon.png',
    apple: '/images/icon-maskable-512.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
        >
          <AuthGate />
          <AutoSyncClient />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
