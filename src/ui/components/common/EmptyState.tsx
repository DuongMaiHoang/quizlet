import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
    return (
        <div data-testid="empty-state" className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none">
            <div className="mb-6 rounded-full bg-primary/10 p-4">
                <Icon className="h-8 w-8 text-primary" />
            </div>
            <h3 data-testid="empty-title" className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
            <p className="mb-8 max-w-sm text-muted-foreground">{description}</p>
            {actionLabel && actionHref && (
                <Link
                    href={actionHref}
                    className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
