import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/Navbar';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'Finance Tracker',
  description: 'Track your finances across multiple accounts and currencies',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {/* <div className="min-h-screen bg-background"> */}
            <Navbar />
            <main className="container mx-auto px-4 py-6">
              {children}
            </main>
          {/* </div> */}
        </Providers>
      </body>
    </html>
  );
}
