import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
    title?: string;
    message: string;
    action?: React.ReactNode;
}

/**
 * ErrorState Component
 * 
 * Displays an error message
 */
export function ErrorState({
    title = 'Something went wrong',
    message,
    action
}: ErrorStateProps) {
    return (
        <div data-testid="error-state" className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
                <AlertCircle className="h-8 w-8 text-error" />
            </div>
            <h3 data-testid="error-title" className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
            <p data-testid="error-message" className="mb-6 max-w-sm text-sm text-muted">{message}</p>
            {action && <div>{action}</div>}
        </div>
    );
}
