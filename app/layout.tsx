import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/ui/components/layout/Header';
import { HanziBoostInit } from '@/ui/components/common/HanziBoostInit';
import { ScrollSpeedReducer } from '@/ui/components/common/ScrollSpeedReducer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Quizlet Clone',
    description: 'A study app',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning style={{ zoom: 0.9 }}>
            <body className={`${inter.className} bg-background text-foreground antialiased`} suppressHydrationWarning>
                <HanziBoostInit />
                <ScrollSpeedReducer />
                <Header />
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {children}
                </main>
            </body>
        </html>
    );
}
