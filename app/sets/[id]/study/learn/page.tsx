'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SetDTO, CardDTO } from '@/application/dto/SetDTO';
import { container } from '@/lib/di';
import { LoadingState } from '@/ui/components/common/LoadingState';
import { ErrorState } from '@/ui/components/common/ErrorState';
import { ChevronLeft, Check, X } from 'lucide-react';

/**
 * Learn Study Mode Page
 * 
 * Type answers and get instant feedback
 */
export default function LearnPage() {
    const params = useParams();
    const router = useRouter();
    const setId = params.id as string;

    const [set, setSet] = useState<SetDTO | null>(null);
    const [cards, setCards] = useState<CardDTO[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
    const [correctCount, setCorrectCount] = useState(0);
    const [incorrectCount, setIncorrectCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        loadSet();
    }, [setId]);

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
            // Shuffle cards for variety
            const shuffled = [...result.cards].sort(() => Math.random() - 0.5);
            setCards(shuffled);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load set');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!userAnswer.trim()) {
            return;
        }

        const currentCard = cards[currentIndex];
        const submitAnswer = container.submitAnswer;
        const result = submitAnswer.execute(userAnswer, currentCard.definition);

        setFeedback({
            isCorrect: result.isCorrect,
            message: result.feedback || '',
        });

        if (result.isCorrect) {
            setCorrectCount(correctCount + 1);
        } else {
            setIncorrectCount(incorrectCount + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setUserAnswer('');
            setFeedback(null);
        } else {
            setIsComplete(true);
        }
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
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors"
                    >
                        Back to Set
                    </Link>
                }
            />
        );
    }

    if (isComplete) {
        const totalAnswered = correctCount + incorrectCount;
        const score = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

        return (
            <div className="mx-auto max-w-2xl space-y-8 text-center">
                <div>
                    <h1 className="text-4xl font-bold text-foreground">Great job!</h1>
                    <p className="mt-2 text-lg text-muted">You've completed the learn mode</p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-8">
                    <div className="mb-6 text-6xl font-bold text-primary">{score}%</div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-success/10 p-4">
                            <div className="text-2xl font-bold text-success">{correctCount}</div>
                            <div className="text-sm text-muted">Correct</div>
                        </div>
                        <div className="rounded-lg bg-error/10 p-4">
                            <div className="text-2xl font-bold text-error">{incorrectCount}</div>
                            <div className="text-sm text-muted">Incorrect</div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center space-x-4">
                    <Link
                        href={`/sets/${setId}`}
                        className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
                    >
                        Back to Set
                    </Link>
                    <button
                        onClick={() => {
                            setCurrentIndex(0);
                            setUserAnswer('');
                            setFeedback(null);
                            setCorrectCount(0);
                            setIncorrectCount(0);
                            setIsComplete(false);
                            const shuffled = [...cards].sort(() => Math.random() - 0.5);
                            setCards(shuffled);
                        }}
                        className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors"
                    >
                        Study Again
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentIndex];
    const progress = Math.round(((currentIndex + 1) / cards.length) * 100);

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            {/* Header */}
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

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">
                        Question {currentIndex + 1} of {cards.length}
                    </span>
                    <div className="flex space-x-4">
                        <span className="text-success">✓ {correctCount}</span>
                        <span className="text-error">✗ {incorrectCount}</span>
                    </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-card">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="rounded-2xl border border-border bg-card p-8">
                <div className="mb-2 text-sm font-medium uppercase text-muted">
                    Define this term
                </div>
                <div className="mb-8 text-3xl font-bold text-foreground">
                    {currentCard.term}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="answer" className="mb-2 block text-sm font-medium text-foreground">
                            Your answer
                        </label>
                        <input
                            id="answer"
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Type your answer..."
                            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            disabled={feedback !== null}
                            autoFocus
                        />
                    </div>

                    {feedback && (
                        <div
                            className={`rounded-lg p-4 ${feedback.isCorrect
                                    ? 'border border-success bg-success/10'
                                    : 'border border-error bg-error/10'
                                }`}
                        >
                            <div className="flex items-center space-x-2">
                                {feedback.isCorrect ? (
                                    <Check className="h-5 w-5 text-success" />
                                ) : (
                                    <X className="h-5 w-5 text-error" />
                                )}
                                <span
                                    className={`font-medium ${feedback.isCorrect ? 'text-success' : 'text-error'
                                        }`}
                                >
                                    {feedback.message}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-4">
                        {!feedback ? (
                            <button
                                type="submit"
                                className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!userAnswer.trim()}
                            >
                                Check Answer
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors"
                            >
                                {currentIndex < cards.length - 1 ? 'Next Question' : 'Finish'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
