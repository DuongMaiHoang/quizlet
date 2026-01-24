'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { SetDTO, CardDTO } from '@/application/dto/SetDTO';
import { container } from '@/lib/di';
import type { LearnItem } from '@/ui/lib/learn/learnSessionBuilder';
import {
    buildInitialLearnState,
    loadLearnSession,
    saveLearnSession,
    clearLearnSession,
    type LearnOutcome,
    type LearnPersistenceState,
} from '@/ui/lib/learn/learnPersistence';

type ViewStatus = 'loading' | 'notfound' | 'empty' | 'ready' | 'buildError' | 'complete';

interface FeedbackState {
    status: 'none' | 'correct' | 'incorrect';
}

/**
 * Learn Mode MCQ - Canonical Route
 *
 * Route: /study/:setId/learn
 *
 * Implements:
 * - BR-SES (session build & error)
 * - BR-MCQ (option generation via builder)
 * - BR-ANS (answering & feedback)
 * - BR-KBD (keyboard & focus)
 * - BR-PRS (persistence & resume)
 */
export default function LearnCanonicalPage() {
    const params = useParams();
    const router = useRouter();
    const setId = params.setId as string;

    const [set, setSet] = useState<SetDTO | null>(null);
    const [status, setStatus] = useState<ViewStatus>('loading');
    const [items, setItems] = useState<LearnItem[]>([]);
    const [outcomes, setOutcomes] = useState<Record<string, LearnOutcome>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [feedback, setFeedback] = useState<FeedbackState>({ status: 'none' });
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isBuilding, setIsBuilding] = useState(false);
    const [lastContinueAt, setLastContinueAt] = useState<number | null>(null);

    const firstOptionRef = useRef<HTMLButtonElement | null>(null);
    const continueButtonRef = useRef<HTMLButtonElement | null>(null);

    const currentItem: LearnItem | undefined = items[currentIndex];

    const navigateBackToSet = useCallback(() => {
        router.push(`/sets/${setId}`);
    }, [router, setId]);

    const initializeSession = useCallback(
        async (forceNew = false) => {
            try {
                setIsBuilding(true);
                setStatus('loading');

                const getSet = container.getSet;
                const result = await getSet.execute(setId);

                if (!result) {
                    setStatus('notfound');
                    return;
                }

                if (result.cards.length === 0) {
                    setSet(result);
                    setStatus('empty');
                    return;
                }

                setSet(result);

                const cards: CardDTO[] = result.cards;
                let persisted: LearnPersistenceState | null = null;

                if (!forceNew) {
                    persisted = loadLearnSession(setId, cards);
                }

                const state = persisted ?? buildInitialLearnState(setId, cards);

                setItems(state.items);
                setOutcomes(state.outcomesByItemId || {});
                setCurrentIndex(
                    state.currentIndex >= 0 && state.currentIndex < state.items.length
                        ? state.currentIndex
                        : 0
                );
                setFeedback({ status: 'none' });
                setSelectedOptionId(null);

                // If we restored a session that was already at/after the last item, treat as complete
                if (state.currentIndex >= state.items.length) {
                    setStatus('complete');
                } else {
                    setStatus('ready');
                }
            } catch (error) {
                console.error('Error building learn session:', error);
                setStatus('buildError');
            } finally {
                setIsBuilding(false);
            }
        },
        [setId]
    );

    useEffect(() => {
        initializeSession();
    }, [initializeSession]);

    // Focus management (BR-KBD-003)
    useEffect(() => {
        if (status !== 'ready') return;

        if (feedback.status === 'none') {
            if (firstOptionRef.current) {
                firstOptionRef.current.focus();
            }
        } else {
            if (continueButtonRef.current) {
                continueButtonRef.current.focus();
            }
        }
    }, [status, feedback.status, currentIndex]);

    // Keyboard shortcuts (BR-KBD-001, BR-KBD-002, BR-KBD-003)
    useEffect(() => {
        if (status !== 'ready') return;
        if (!currentItem) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Esc: back to set
            if (e.key === 'Escape') {
                e.preventDefault();
                navigateBackToSet();
                return;
            }

            // Enter in feedback state -> continue
            if (e.key === 'Enter' && feedback.status !== 'none') {
                e.preventDefault();
                handleContinue();
                return;
            }

            // 1..K selects in unanswered state
            if (feedback.status === 'none' && /^[1-9]$/.test(e.key)) {
                const index = Number(e.key) - 1;
                if (index >= 0 && index < currentItem.options.length) {
                    e.preventDefault();
                    const option = currentItem.options[index];
                    handleSelectOption(option.optionId);
                }
            }
        };

        const handleSelectOption = (optionId: string) => {
            if (!currentItem) return;
            if (feedback.status !== 'none') return;

            const option = currentItem.options.find((opt) => opt.optionId === optionId);
            if (!option) return;

            const isCorrect = option.isCorrect;
            const outcome: LearnOutcome = isCorrect ? 'correct' : 'incorrect';

            setSelectedOptionId(optionId);
            setFeedback({ status: isCorrect ? 'correct' : 'incorrect' });

            setOutcomes((prev) => {
                const next = { ...prev, [currentItem.itemId]: outcome };
                saveLearnSession(setId, items, next, currentIndex);
                return next;
            });
        };

        const handleContinue = () => {
            if (!currentItem) return;

            const now = Date.now();
            if (lastContinueAt !== null && now - lastContinueAt < 300) {
                // Double-click protection (Validation 8.2)
                return;
            }
            setLastContinueAt(now);

            const isLastItem = currentIndex >= items.length - 1;

            if (isLastItem) {
                // Move index past last item to mark completion
                const newIndex = items.length;
                setCurrentIndex(newIndex);
                saveLearnSession(setId, items, outcomes, newIndex);
                setStatus('complete');
                return;
            }

            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setSelectedOptionId(null);
            setFeedback({ status: 'none' });
            saveLearnSession(setId, items, outcomes, nextIndex);
        };

        // Bind handlers to outer scope
        (window as any).__learn_handle_keydown__ = handleKeyDown;
        (window as any).__learn_handle_select__ = handleSelectOption;
        (window as any).__learn_handle_continue__ = handleContinue;

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        status,
        feedback.status,
        currentItem,
        currentIndex,
        items,
        outcomes,
        navigateBackToSet,
        setId,
        lastContinueAt,
    ]);

    const handleSelectOption = useCallback(
        (optionId: string) => {
            if (!currentItem) return;
            if (feedback.status !== 'none') return;

            const option = currentItem.options.find((opt) => opt.optionId === optionId);
            if (!option) return;

            const isCorrect = option.isCorrect;
            const outcome: LearnOutcome = isCorrect ? 'correct' : 'incorrect';

            setSelectedOptionId(optionId);
            setFeedback({ status: isCorrect ? 'correct' : 'incorrect' });

            setOutcomes((prev) => {
                const next = { ...prev, [currentItem.itemId]: outcome };
                saveLearnSession(setId, items, next, currentIndex);
                return next;
            });
        },
        [currentItem, feedback.status, setId, items, currentIndex]
    );

    const handleSkip = useCallback(() => {
        if (!currentItem) return;
        if (feedback.status !== 'none') return;

        const outcome: LearnOutcome = 'skipped';

        setOutcomes((prev) => {
            const next = { ...prev, [currentItem.itemId]: outcome };
            const nextIndex = currentIndex + 1;

            // If skipping last item, we'll transition to complete
            if (nextIndex >= items.length) {
                setCurrentIndex(items.length);
                saveLearnSession(setId, items, next, items.length);
                setStatus('complete');
            } else {
                setCurrentIndex(nextIndex);
                saveLearnSession(setId, items, next, nextIndex);
            }

            return next;
        });

        setSelectedOptionId(null);
        setFeedback({ status: 'none' });
    }, [currentItem, feedback.status, currentIndex, items, setId]);

    const handleContinue = useCallback(() => {
        if (!currentItem) return;

        const now = Date.now();
        if (lastContinueAt !== null && now - lastContinueAt < 300) {
            return;
        }
        setLastContinueAt(now);

        const isLastItem = currentIndex >= items.length - 1;

        if (isLastItem) {
            const newIndex = items.length;
            setCurrentIndex(newIndex);
            saveLearnSession(setId, items, outcomes, newIndex);
            setStatus('complete');
            return;
        }

        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setSelectedOptionId(null);
        setFeedback({ status: 'none' });
        saveLearnSession(setId, items, outcomes, nextIndex);
    }, [currentItem, currentIndex, items, outcomes, setId, lastContinueAt]);

    const handleRetryBuild = useCallback(() => {
        initializeSession(true);
    }, [initializeSession]);

    const handleRestart = useCallback(() => {
        clearLearnSession(setId);
        initializeSession(true);
    }, [initializeSession, setId]);

    const computeSummary = () => {
        let correct = 0;
        let incorrect = 0;
        let skipped = 0;

        Object.values(outcomes).forEach((o) => {
            if (o === 'correct') correct++;
            else if (o === 'incorrect') incorrect++;
            else if (o === 'skipped') skipped++;
        });

        return { correct, incorrect, skipped };
    };

    const totalItems = items.length;
    const progressLabel =
        status === 'ready' && totalItems > 0
            ? `${currentIndex + 1}/${totalItems}`
            : totalItems > 0
            ? `${Math.min(currentIndex, totalItems)}/${totalItems}`
            : '';

    // Shared wrapper with root test id
    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <div data-testid="learn-root" className="mx-auto max-w-3xl px-4 py-8">
            {children}
        </div>
    );

    // Loading Screen (5.1)
    if (status === 'loading') {
        return (
            <Wrapper>
                <div
                    data-testid="learn-loading"
                    className="space-y-6"
                >
                    <div className="h-6 w-32 rounded bg-card animate-pulse" />
                    <div className="h-24 w-full rounded-2xl bg-card animate-pulse" />
                    <div className="space-y-3">
                        <div className="h-12 w-full rounded-xl bg-card animate-pulse" />
                        <div className="h-12 w-full rounded-xl bg-card animate-pulse" />
                        <div className="h-12 w-full rounded-xl bg-card animate-pulse" />
                        <div className="h-12 w-full rounded-xl bg-card animate-pulse" />
                    </div>
                    <div className="text-sm text-muted">Đang tải...</div>
                </div>
            </Wrapper>
        );
    }

    // Not Found Screen (5.2)
    if (status === 'notfound') {
        return (
            <Wrapper>
                <div
                    data-testid="learn-notfound"
                    className="space-y-4 text-center"
                >
                    <h1 className="text-2xl font-bold text-foreground">Không tìm thấy bộ thẻ</h1>
                    <div className="mt-4">
                        <Link
                            href="/"
                            className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                        >
                            Quay lại
                        </Link>
                    </div>
                </div>
            </Wrapper>
        );
    }

    // Empty Set Screen (5.3)
    if (status === 'empty' && set) {
        return (
            <Wrapper>
                <div
                    data-testid="learn-empty"
                    className="space-y-4 text-center"
                >
                    <h1 className="text-2xl font-bold text-foreground">Chưa có thẻ nào</h1>
                    <p className="text-muted">Hãy thêm thẻ để bắt đầu học.</p>
                    <div className="mt-4">
                        <Link
                            href={`/sets/${set.id}/edit`}
                            className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                        >
                            Thêm thẻ
                        </Link>
                    </div>
                </div>
            </Wrapper>
        );
    }

    // Build error (BR-SES-004)
    if (status === 'buildError') {
        return (
            <Wrapper>
                <div className="space-y-4 text-center">
                    <p className="text-sm text-error">
                        Có lỗi khi tạo bài học. Vui lòng thử lại.
                    </p>
                    <button
                        type="button"
                        onClick={handleRetryBuild}
                        disabled={isBuilding}
                        className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Thử lại
                    </button>
                </div>
            </Wrapper>
        );
    }

    // Completion Screen (5.5, BR-CMP)
    if (status === 'complete') {
        const summary = computeSummary();

        return (
            <Wrapper>
                <div
                    data-testid="learn-complete"
                    className="space-y-6 text-center"
                >
                    <h1 className="text-3xl font-bold text-foreground">Hoàn thành</h1>
                    <div className="mx-auto max-w-sm space-y-3 rounded-2xl border border-border bg-card p-6">
                        <div className="flex items-center justify-between text-sm text-foreground">
                            <span>Đúng</span>
                            <span>Đúng: {summary.correct}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-foreground">
                            <span>Sai</span>
                            <span>Sai: {summary.incorrect}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-foreground">
                            <span>Bỏ qua</span>
                            <span>Bỏ qua: {summary.skipped}</span>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <button
                            type="button"
                            data-testid="learn-restart"
                            onClick={handleRestart}
                            className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                        >
                            Học lại
                        </button>
                        <button
                            type="button"
                            data-testid="learn-back-to-set"
                            onClick={navigateBackToSet}
                            className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
                        >
                            Về bộ thẻ
                        </button>
                    </div>
                </div>
            </Wrapper>
        );
    }

    // Guard: if not ready or no item, fallback to loading
    if (status !== 'ready' || !set || !currentItem) {
        return (
            <Wrapper>
                <div className="text-sm text-muted">Đang tải...</div>
            </Wrapper>
        );
    }

    const isFeedbackState = feedback.status !== 'none';

    return (
        <Wrapper>
            {/* Top bar */}
            <div className="mb-6 flex items-center justify-between">
                <button
                    type="button"
                    onClick={navigateBackToSet}
                    className="inline-flex items-center text-sm text-muted hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Quay lại
                </button>
                <div className="text-sm font-medium text-foreground truncate max-w-xs text-center">
                    {set.title}
                </div>
                <div
                    data-testid="learn-progress"
                    className="text-sm text-muted"
                >
                    {progressLabel}
                </div>
            </div>

            {/* Prompt card */}
            <div className="mb-6 rounded-2xl border border-border bg-card p-6">
                <div
                    data-testid="learn-prompt"
                    className="mb-4 text-2xl font-bold text-foreground"
                >
                    {currentItem.prompt}
                </div>
                <div className="text-sm text-muted">Chọn đáp án đúng</div>
            </div>

            {/* Options */}
            <div className="mb-6 space-y-3">
                {currentItem.options.map((option, index) => {
                    const optionIndex = index + 1;
                    const testId = `learn-option-${optionIndex}` as
                        | 'learn-option-1'
                        | 'learn-option-2'
                        | 'learn-option-3'
                        | 'learn-option-4';

                    const isSelected = selectedOptionId === option.optionId;
                    const isCorrect = option.isCorrect;

                    let optionStyle =
                        'w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30';

                    if (!isFeedbackState) {
                        optionStyle +=
                            ' border-border bg-card hover:bg-card-hover text-foreground';
                    } else {
                        if (isCorrect) {
                            optionStyle +=
                                ' border-success bg-success/10 text-success';
                        } else if (isSelected && !isCorrect) {
                            optionStyle +=
                                ' border-error bg-error/10 text-error';
                        } else {
                            optionStyle +=
                                ' border-border bg-card text-foreground opacity-60';
                        }
                    }

                    return (
                        <button
                            key={option.optionId}
                            type="button"
                            data-testid={testId}
                            ref={index === 0 ? firstOptionRef : null}
                            onClick={() => handleSelectOption(option.optionId)}
                            disabled={isFeedbackState}
                            aria-pressed={isSelected}
                            className={optionStyle}
                        >
                            <span className="line-clamp-2">{option.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Bottom actions & feedback */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    data-testid="learn-skip"
                    onClick={handleSkip}
                    disabled={isFeedbackState}
                    className="text-sm text-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Bỏ qua
                </button>

                {isFeedbackState && (
                    <button
                        type="button"
                        data-testid="learn-continue"
                        ref={continueButtonRef}
                        onClick={handleContinue}
                        className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                    >
                        Tiếp tục
                    </button>
                )}
            </div>

            {/* Feedback area */}
            {isFeedbackState && (
                <div
                    data-testid="learn-feedback"
                    className="mt-6 rounded-xl border border-border bg-card p-4"
                >
                    {feedback.status === 'correct' ? (
                        <div className="text-sm font-medium text-success">
                            Đúng rồi!
                        </div>
                    ) : (
                        <div className="space-y-1 text-sm text-foreground">
                            <div className="font-medium text-error">Chưa đúng</div>
                            <div>
                                Đáp án đúng là: {currentItem.correctAnswer}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Wrapper>
    );
}


