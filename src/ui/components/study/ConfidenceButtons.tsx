'use client';

import { CardStatus } from '@/domain/entities/FlashcardsProgress';
import { CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * ConfidenceButtons Component
 * 
 * Know / Still learning buttons with visual feedback.
 * BR-KNOW-01, BR-LEARN-01, BR-SET-01, BR-SET-02
 */
interface ConfidenceButtonsProps {
    currentStatus: CardStatus;
    onMarkKnow: () => void;
    onMarkLearning: () => void;
}

export function ConfidenceButtons({
    currentStatus,
    onMarkKnow,
    onMarkLearning,
}: ConfidenceButtonsProps) {
    const isKnow = currentStatus === 'know';
    const isLearning = currentStatus === 'learning';

    return (
        <div className="flex items-center justify-center gap-4">
            <button
                onClick={onMarkLearning}
                className={`inline-flex items-center rounded-lg border-2 px-6 py-3 text-sm font-medium transition-colors ${
                    isLearning
                        ? 'border-warning bg-warning/10 text-warning'
                        : 'border-border text-foreground hover:bg-card-hover'
                }`}
                aria-label="Mark as Still learning"
            >
                <AlertCircle className={`mr-2 h-5 w-5 ${isLearning ? 'text-warning' : ''}`} />
                Still learning
            </button>

            <button
                onClick={onMarkKnow}
                className={`inline-flex items-center rounded-lg border-2 px-6 py-3 text-sm font-medium transition-colors ${
                    isKnow
                        ? 'border-success bg-success/10 text-success'
                        : 'border-border text-foreground hover:bg-card-hover'
                }`}
                aria-label="Mark as Know"
            >
                <CheckCircle2 className={`mr-2 h-5 w-5 ${isKnow ? 'text-success' : ''}`} />
                Know
            </button>
        </div>
    );
}
