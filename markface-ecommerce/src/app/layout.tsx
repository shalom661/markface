import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MarkFace | Conforto e Qualidade em Pijamas e Roupas',
  description:
    'Descubra a coleção exclusiva MarkFace. Pijamas, lingeries e roupas casuais que unem sofisticação, conforto e extrema qualidade.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="light">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body className={`${manrope.variable} font-display antialiased selection:bg-primary/10 selection:text-primary bg-background text-slate-900`}>
        <Header />
        <main className="min-h-[70vh]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
