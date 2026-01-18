'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SetDTO, CardDTO } from '@/application/dto/SetDTO';
import { container } from '@/lib/di';
import { LoadingState } from '@/ui/components/common/LoadingState';
import { ErrorState } from '@/ui/components/common/ErrorState';
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw } from 'lucide-react';

/**
 * Flashcards Study Mode Page
 * 
 * Review cards with flip animation
 */
export default function FlashcardsPage() {
    const params = useParams();
    const router = useRouter();
    const setId = params.id as string;

    const [set, setSet] = useState<SetDTO | null>(null);
    const [originalCards, setOriginalCards] = useState<CardDTO[]>([]); // BR-FC-05: Store original order
    const [cards, setCards] = useState<CardDTO[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isShuffled, setIsShuffled] = useState(false); // BR-FC-05: Toggle state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSet();
    }, [setId]);

    // Keyboard support (BR-FC-*)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (loading || error) return;

            // Space to flip
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scroll
                setIsFlipped((prev) => !prev);
            }

            // Arrows to navigate
            if (e.code === 'ArrowRight') {
                handleNext();
            }
            if (e.code === 'ArrowLeft') {
                handlePrevious();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [loading, error, currentIndex, cards.length]); // Dependencies for closure stability

    const loadSet = async () => {
        try {
            setLoading(true);
            setError(null);
            const getSet = container.getSet;
            const result = await getSet.execute(setId);

            if (!result) {
                setError('Set not found');
                return;
            }

            if (result.cards.length === 0) {
                setError('This set has no cards to study');
                return;
            }

            setSet(result);
            setOriginalCards(result.cards); // Store original
            setCards(result.cards);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load set');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        // Need to use functional update or ref to get current state inside event listener if not using dependency array correctly.
        // But since we put it in dependency array, simple check is fine.
        // Actually, helper functions inside component are captured.
        // Let's rely on the state available in render.
        // Note: For useEffect closure, we need to call the functions or use refs.
        // Simplified: I will define these inside the effect or make them stable?
        // Let's keep them here but access current state via setState callbacks if needed,
        // OR rely on the fact that useEffect depends on [currentIndex].
        // To be safe for the keydown listener, I'll rely on the latest closure:

        setCards((currentCards) => {
            setCurrentIndex((prevIndex) => {
                if (prevIndex < currentCards.length - 1) {
                    setIsFlipped(false);
                    return prevIndex + 1;
                }
                return prevIndex;
            });
            return currentCards;
        });
    };

    const handlePrevious = () => {
        setCards((currentCards) => {
            setCurrentIndex((prevIndex) => {
                if (prevIndex > 0) {
                    setIsFlipped(false);
                    return prevIndex - 1;
                }
                return prevIndex;
            });
            return currentCards;
        });
    };

    const toggleShuffle = () => {
        if (!isShuffled) {
            // Turn ON: Shuffle in memory, reset index
            const shuffled = [...originalCards].sort(() => Math.random() - 0.5);
            setCards(shuffled);
            setIsShuffled(true);
        } else {
            // Turn OFF: Restore original, reset index
            setCards(originalCards);
            setIsShuffled(false);
        }
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    const handleReset = () => {
        setCurrentIndex(0);
        setIsFlipped(false);
        // Requirement implies resetting navigation? 
        // "Shuffle changes in-memory order only".
        // Reset doesn't have a specific BR other than implicit UX.
    };

    if (loading) {
        return <LoadingState />;
    }

    if (error || !set) {
        return (
            <ErrorState
                message={error || 'Set not found'}
                action={
                    <Link
                        href={`/sets/${setId}`}
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                    >
                        Back to Set
                    </Link>
                }
            />
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href={`/sets/${setId}`}
                        className="mb-2 inline-flex items-center text-sm text-muted hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back to set
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground">{set.title}</h1>
                </div>

                <div className="flex space-x-2">
                    <button
                        onClick={toggleShuffle}
                        className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${isShuffled
                                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                                : 'border-border text-foreground hover:bg-card-hover'
                            }`}
                    >
                        <Shuffle className="mr-2 h-4 w-4" />
                        {isShuffled ? 'Shuffled' : 'Shuffle'}
                    </button>
                    <button
                        onClick={handleReset}
                        className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">
                        Card {currentIndex + 1} of {cards.length}
                    </span>
                    <span className="text-muted">
                        {Math.round(((currentIndex + 1) / cards.length) * 100)}% complete
                    </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-card">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Flashcard */}
            <div className="relative">
                <div
                    className="group relative h-96 cursor-pointer"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <div
                        className={`absolute inset-0 transition-all duration-500 ${isFlipped ? '[transform:rotateY(180deg)]' : ''
                            }`}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Front (Term) */}
                        <div
                            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-8 text-center shadow-xl"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <div className="mb-4 text-sm font-medium uppercase text-muted">
                                Term
                            </div>
                            <div className="text-3xl font-bold text-foreground">
                                {currentCard.term}
                            </div>
                            <div className="mt-8 text-sm text-muted">
                                Click to flip or Press Space
                            </div>
                        </div>

                        {/* Back (Definition) */}
                        <div
                            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-primary bg-card p-8 text-center shadow-xl [transform:rotateY(180deg)]"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <div className="mb-4 text-sm font-medium uppercase text-muted">
                                Definition
                            </div>
                            <div className="text-2xl font-semibold text-foreground">
                                {currentCard.definition}
                            </div>
                            <div className="mt-8 text-sm text-muted">
                                Click to flip back or Press Space
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => handlePrevious()}
                    disabled={currentIndex === 0}
                    className="inline-flex items-center rounded-lg bg-card-hover px-6 py-3 text-sm font-medium text-foreground hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Previous
                </button>

                <button
                    onClick={() => handleNext()}
                    disabled={currentIndex === cards.length - 1}
                    className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                    <ChevronRight className="ml-2 h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
