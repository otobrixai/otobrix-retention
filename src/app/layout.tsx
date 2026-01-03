// src/app/layout.tsx - update to include font loading
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import ClientProviders from '@/components/app/ClientProviders';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'RetentionIQ - Enterprise AI Churn Analytics',
  description: 'AI-powered enterprise customer retention platform with real-time financial analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`} style={{ colorScheme: 'dark' }}>
      <body className="enterprise-dark-bg min-h-screen text-slate-100">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}