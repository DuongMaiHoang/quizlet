'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { SetDTO, CardDTO } from '@/application/dto/SetDTO';
import { container } from '@/lib/di';
import { LoadingState } from '@/ui/components/common/LoadingState';
import { ErrorState } from '@/ui/components/common/ErrorState';
import { EmptyState } from '@/ui/components/common/EmptyState';
import { Flashcard } from '@/ui/components/study/Flashcard';
import { ProgressIndicator } from '@/ui/components/study/ProgressIndicator';
import { ConfidenceButtons } from '@/ui/components/study/ConfidenceButtons';
import { ResetProgressModal } from '@/ui/components/study/ResetProgressModal';
import { useFlashcardsStore } from '@/ui/store/flashcardsStore';
import { CardKey } from '@/domain/value-objects/CardKey';
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw, FileQuestion } from 'lucide-react';

/**
 * Flashcards Study Mode Page - Canonical Route
 * 
 * Route: /study/:setId/flashcards
 * 
 * This route uses params.setId (not params.id) to match the route structure.
 * Reuses the same logic as /sets/:id/study/flashcards but with correct param extraction.
 */
export default function FlashcardsPage() {
    const params = useParams();
    // Fix: Use params.setId for canonical route (not params.id)
    const setId = params.setId as string;

    const [set, setSet] = useState<SetDTO | null>(null);
    const [originalCardKeys, setOriginalCardKeys] = useState<string[]>([]);
    const [cardMap, setCardMap] = useState<Map<string, CardDTO>>(new Map());
    const [showResetModal, setShowResetModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const {
        progress,
        cardOrder,
        isLoading: progressLoading,
        error: progressError,
        loadProgress,
        flip,
        next,
        prev,
        markKnow,
        markLearning,
        toggleShuffle,
        resetProgress,
    } = useFlashcardsStore();

    // Load set and initialize progress
    useEffect(() => {
        const initialize = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load set
                const getSet = container.getSet;
                const result = await getSet.execute(setId);

                if (!result) {
                    setError('Set not found');
                    return;
                }

                // BR-EMP-01: Handle empty set
                if (result.cards.length === 0) {
                    setSet(result);
                    return;
                }

                setSet(result);

                // Create card keys and map
                const keys: string[] = [];
                const map = new Map<string, CardDTO>();

                result.cards.forEach((card, index) => {
                    // Prefer card.id, fallback to setId::index
                    const key = card.id
                        ? CardKey.fromCardId(card.id).toString()
                        : CardKey.fromSetIdAndIndex(setId, index).toString();
                    keys.push(key);
                    map.set(key, card);
                });

                setOriginalCardKeys(keys);
                setCardMap(map);

                // Load progress
                await loadProgress(setId, keys);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load set');
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, [setId, loadProgress]);

    // Keyboard shortcuts
    useEffect(() => {
        if (loading || error || !progress || !set) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent default for shortcuts
            if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyK', 'KeyL', 'KeyS', 'KeyR'].includes(e.code)) {
                e.preventDefault();
            }

            // Space: flip
            if (e.code === 'Space') {
                flip();
            }

            // ArrowRight: next
            if (e.code === 'ArrowRight') {
                next();
            }

            // ArrowLeft: prev
            if (e.code === 'ArrowLeft') {
                prev();
            }

            // K: mark Know
            if (e.code === 'KeyK') {
                const currentCardKey = getCurrentCardKey();
                if (currentCardKey) {
                    markKnow(CardKey.fromString(currentCardKey));
                }
            }

            // L: mark Learning
            if (e.code === 'KeyL') {
                const currentCardKey = getCurrentCardKey();
                if (currentCardKey) {
                    markLearning(CardKey.fromString(currentCardKey));
                }
            }

            // S: toggle shuffle
            if (e.code === 'KeyS') {
                toggleShuffle(originalCardKeys);
            }

            // R: reset (open modal)
            if (e.code === 'KeyR') {
                setShowResetModal(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [loading, error, progress, set, flip, next, prev, markKnow, markLearning, toggleShuffle, originalCardKeys]);

    const getCurrentCardKey = (): string | null => {
        if (!progress || cardOrder.length === 0) return null;
        return cardOrder[progress.index] || null;
    };

    const getCurrentCard = (): CardDTO | null => {
        const key = getCurrentCardKey();
        if (!key) return null;
        return cardMap.get(key) || null;
    };

    const handleMarkKnow = useCallback(() => {
        const key = getCurrentCardKey();
        if (key) {
            markKnow(CardKey.fromString(key));
        }
    }, [markKnow, progress, cardOrder]);

    const handleMarkLearning = useCallback(() => {
        const key = getCurrentCardKey();
        if (key) {
            markLearning(CardKey.fromString(key));
        }
    }, [markLearning, progress, cardOrder]);

    const handleReset = useCallback(async () => {
        await resetProgress(setId);
        // Reload progress after reset
        await loadProgress(setId, originalCardKeys);
    }, [setId, resetProgress, loadProgress, originalCardKeys]);

    // Loading state
    if (loading || progressLoading) {
        return <LoadingState />;
    }

    // Error state
    if (error || progressError) {
        return (
            <ErrorState
                title="Set not found"
                message={error || progressError || 'Set not found'}
                action={
                    <Link
                        href={`/sets/${setId}`}
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors"
                    >
                        Back to Set
                    </Link>
                }
            />
        );
    }

    // Empty set
    if (set && set.cards.length === 0) {
        return (
            <div className="mx-auto max-w-4xl">
                <Link
                    href={`/sets/${setId}`}
                    className="mb-4 inline-flex items-center text-sm text-muted hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back to set
                </Link>
                <EmptyState
                    icon={FileQuestion}
                    title="No cards yet"
                    description="This set doesn't have any cards to study."
                    actionLabel="Add cards"
                    actionHref={`/sets/${setId}/edit`}
                />
            </div>
        );
    }

    // Ready state
    if (!set || !progress || cardOrder.length === 0) {
        return <LoadingState />;
    }

    const currentCard = getCurrentCard();
    if (!currentCard) {
        return <ErrorState message="Card not found" />;
    }

    const currentCardKey = getCurrentCardKey();
    const currentStatus = currentCardKey ? progress.getCardStatus(CardKey.fromString(currentCardKey)) : 'unset';
    const stats = progress.getStats();

    return (
        <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href={`/sets/${setId}`}
                        className="mb-2 inline-flex items-center text-sm text-muted hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back to set
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{set.title}</h1>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        data-testid="flashcard-shuffle-toggle"
                        onClick={() => toggleShuffle(originalCardKeys)}
                        className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${progress.order === 'shuffled'
                            ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                            : 'border-border text-foreground hover:bg-card-hover'
                            }`}
                        aria-label="Toggle shuffle"
                    >
                        <Shuffle className="mr-2 h-4 w-4" />
                        {progress.order === 'shuffled' ? 'Shuffled' : 'Shuffle'}
                    </button>
                    <button
                        data-testid="flashcard-reset"
                        onClick={() => setShowResetModal(true)}
                        className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
                        aria-label="Reset progress"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Progress Indicator */}
            <ProgressIndicator
                currentIndex={progress.index}
                total={cardOrder.length}
                knownCount={stats.known}
                learningCount={stats.learning}
            />

            {/* Flashcard */}
            <div className="relative">
                <Flashcard
                    term={currentCard.term}
                    definition={currentCard.definition}
                    side={progress.side}
                    onFlip={flip}
                />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    data-testid="flashcard-prev"
                    onClick={prev}
                    disabled={progress.index === 0}
                    className="inline-flex items-center rounded-lg bg-card-hover px-6 py-3 text-sm font-medium text-foreground hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous card"
                >
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Previous
                </button>

                <button
                    data-testid="flashcard-next"
                    onClick={next}
                    disabled={cardOrder.length === 0 || progress.index >= cardOrder.length - 1}
                    className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next card"
                >
                    Next
                    <ChevronRight className="ml-2 h-5 w-5" />
                </button>
            </div>

            {/* Confidence Buttons */}
            <ConfidenceButtons
                currentStatus={currentStatus}
                onMarkKnow={handleMarkKnow}
                onMarkLearning={handleMarkLearning}
            />

            {/* Reset Modal */}
            <ResetProgressModal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                onConfirm={handleReset}
            />
        </div>
    );
}
