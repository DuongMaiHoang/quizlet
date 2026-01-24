'use client';

import Link from 'next/link';
import { SetDTO } from '@/application/dto/SetDTO';
import { BookOpen, Edit2, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface SetCardProps {
    set: SetDTO;
    onDelete?: (id: string) => void;
}

/**
 * SetCard Component
 * 
 * Displays a single study set as a card
 */
export function SetCard({ set, onDelete }: SetCardProps) {
    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (confirm(`Are you sure you want to delete "${set.title}"?`)) {
            onDelete?.(set.id);
        }
    };

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const isActionButton = target.closest('a[href*="/study/"], a[href*="/edit"], button');

        // If clicking on action buttons, don't navigate
        if (isActionButton) {
            return;
        }

        // If clicking on the title link, let it handle navigation
        if (target.closest('a[href*="/sets/"]')) {
            return;
        }

        // Otherwise, navigate to set detail
        window.location.href = `/sets/${set.id}`;
    };

    return (
        <div 
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-md cursor-pointer"
            onClick={handleCardClick}
        >
            {/* Content Section */}
            <div className="mb-5 space-y-3">
                <Link href={`/sets/${set.id}`} className="block">
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2">
                        {set.title}
                    </h3>
                </Link>
                {set.description && (
                    <p className="text-sm leading-relaxed text-muted/80 line-clamp-2">
                        {set.description}
                    </p>
                )}
            </div>

            {/* Metadata Section */}
            <div className="mb-5 flex items-center gap-3 text-xs text-muted/60">
                <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{set.cardCount} {set.cardCount === 1 ? 'card' : 'cards'}</span>
                </div>
                <span className="text-muted/40">•</span>
                <span>{formatRelativeTime(new Date(set.updatedAt))}</span>
            </div>

            {/* Actions Section */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Link
                        href={`/study/${set.id}/flashcards`}
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                        Study
                    </Link>
                    <Link
                        href={`/sets/${set.id}/edit`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                    </Link>
                </div>

                {onDelete && (
                    <button
                        onClick={handleDelete}
                        className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted hover:border-error hover:bg-error/5 hover:text-error transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-error/20 cursor-pointer"
                        aria-label="Delete set"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
