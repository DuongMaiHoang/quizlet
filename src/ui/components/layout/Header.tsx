'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { HanziBoostSettings } from '@/ui/components/settings/HanziBoostSettings';

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1 transition-colors duration-200 cursor-pointer">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white">Q</div>
                    <span className="text-xl font-bold tracking-tight text-foreground">Quizlet Clone</span>
                </Link>

                <nav className="flex items-center gap-4">
                    <HanziBoostSettings />
                    <Link
                        href="/sets/new"
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Create Set</span>
                    </Link>
                </nav>
            </div>
        </header>
    );
}
