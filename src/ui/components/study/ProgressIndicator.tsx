'use client';

/**
 * ProgressIndicator Component
 * 
 * Shows current position and stats.
 * BR-PROG-01, BR-PROG-02, BR-PROG-03
 */
interface ProgressIndicatorProps {
    currentIndex: number;
    total: number;
    knownCount: number;
    learningCount: number;
}

export function ProgressIndicator({
    currentIndex,
    total,
    knownCount,
    learningCount,
}: ProgressIndicatorProps) {
    const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                    Card {currentIndex + 1} of {total}
                </span>
                <div className="flex items-center gap-4">
                    <span className="text-muted">
                        <span className="font-medium text-success">{knownCount}</span> Known
                    </span>
                    <span className="text-muted">
                        <span className="font-medium text-warning">{learningCount}</span> Learning
                    </span>
                </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-card">
                <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
