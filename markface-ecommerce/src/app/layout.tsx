import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
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
    <html lang="pt-BR">
      <body className={`${inter.variable} ${playfair.variable} antialiased selection:bg-brand-navy/10 selection:text-brand-navy`}>
        <Header />
        <main className="min-h-[70vh]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
