import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';

import { AuthProvider } from '@/lib/providers/auth-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | Airflow B2B Shop',
    default: 'Airflow B2B Shop - 電子煙批發專業平台',
  },
  description: '專為電子煙批發產業設計的整合性B2B電商與CRM平台',
  keywords: ['電子煙', '批發', 'B2B', '電商', 'CRM', 'Airflow'],
  authors: [{ name: 'Airflow B2B Shop' }],
  creator: 'Airflow B2B Shop',
  publisher: 'Airflow B2B Shop',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://airflow-shop.com'),
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: process.env.NEXTAUTH_URL || 'https://airflow-shop.com',
    siteName: 'Airflow B2B Shop',
    title: 'Airflow B2B Shop - 電子煙批發專業平台',
    description: '專為電子煙批發產業設計的整合性B2B電商與CRM平台',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Airflow B2B Shop',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Airflow B2B Shop - 電子煙批發專業平台',
    description: '專為電子煙批發產業設計的整合性B2B電商與CRM平台',
    images: ['/twitter-image.jpg'],
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="min-h-screen bg-background font-sans antialiased">
              <div id="root" className="relative flex min-h-screen flex-col">
                <main className="flex-1">{children}</main>
              </div>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}