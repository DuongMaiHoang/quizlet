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
    type LearnStatus,
    type LearnPersistenceState,
} from '@/ui/lib/learn/learnPersistence';

type ViewStatus = 'loading' | 'notfound' | 'empty' | 'ready' | 'buildError' | 'complete';

interface FeedbackState {
    status: 'none' | 'correct' | 'incorrect';
}

interface ProgressStats {
    correct: number;
    incorrect: number;
    skipped: number;
    percent: number;
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
 * - BR-ADP-* (adaptive retry & total progress)
 */
export default function LearnCanonicalPage() {
    const params = useParams();
    const router = useRouter();
    const setId = params.setId as string;

    const [set, setSet] = useState<SetDTO | null>(null);
    const [status, setStatus] = useState<ViewStatus>('loading');
    const [items, setItems] = useState<LearnItem[]>([]);
    const [statusByItemId, setStatusByItemId] = useState<Record<string, LearnStatus>>({});
    const [currentIndex, setCurrentIndex] = useState(0); // index within current pool
    const [attempt, setAttempt] = useState(1);
    const [poolItemIds, setPoolItemIds] = useState<string[]>([]);
    const [maxProgressPercent, setMaxProgressPercent] = useState(0);
    const [feedback, setFeedback] = useState<FeedbackState>({ status: 'none' });
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isBuilding, setIsBuilding] = useState(false);
    const [lastContinueAt, setLastContinueAt] = useState<number | null>(null);

    const firstOptionRef = useRef<HTMLButtonElement | null>(null);
    const continueButtonRef = useRef<HTMLButtonElement | null>(null);

    const currentItemId = poolItemIds[currentIndex];
    const currentItem: LearnItem | undefined = items.find((item) => item.itemId === currentItemId);

    const navigateBackToSet = useCallback(() => {
        router.push(`/sets/${setId}`);
    }, [router, setId]);

    const computeProgress = useCallback(
        (statuses: Record<string, LearnStatus>, allItems: LearnItem[]): ProgressStats => {
            let correct = 0;
            let incorrect = 0;
            let skipped = 0;

            allItems.forEach((item) => {
                const s = statuses[item.itemId] ?? 'unseen';
                if (s === 'correct') correct++;
                else if (s === 'incorrect') incorrect++;
                else if (s === 'skipped') skipped++;
            });

            const total = allItems.length;
            const percent = total > 0 ? Math.floor((correct / total) * 100) : 0;

            return { correct, incorrect, skipped, percent };
        },
        []
    );

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
                setStatusByItemId(state.statusByItemId || {});
                setAttempt(state.attempt || 1);
                setPoolItemIds(
                    Array.isArray(state.poolItemIds) && state.poolItemIds.length > 0
                        ? state.poolItemIds
                        : state.items.map((i) => i.itemId)
                );
                const poolLength =
                    Array.isArray(state.poolItemIds) && state.poolItemIds.length > 0
                        ? state.poolItemIds.length
                        : state.items.length;
                setCurrentIndex(
                    state.currentIndex >= 0 && state.currentIndex < poolLength ? state.currentIndex : 0
                );
                setMaxProgressPercent(state.maxProgressPercent ?? 0);
                setFeedback({ status: 'none' });
                setSelectedOptionId(null);

                // If we restored a session that was already at/after the last item, treat as complete
                if (state.currentIndex >= poolLength) {
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

    const persistState = useCallback(
        (overrides?: Partial<LearnPersistenceState>) => {
            if (!setId) return;

            const base: LearnPersistenceState = {
                version: 'v2',
                setId,
                items,
                statusByItemId,
                currentIndex,
                attempt,
                poolItemIds,
                maxProgressPercent,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const next: LearnPersistenceState = {
                ...base,
                ...overrides,
            };

            saveLearnSession(next);
        },
        [attempt, currentIndex, items, maxProgressPercent, poolItemIds, setId, statusByItemId]
    );

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

            const isLastItem = currentIndex >= poolItemIds.length - 1;

            if (isLastItem) {
                // Move index past last item to mark completion
                const newIndex = poolItemIds.length;
                setCurrentIndex(newIndex);
                persistState({ currentIndex: newIndex });
                setStatus('complete');
                return;
            }

            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setSelectedOptionId(null);
            setFeedback({ status: 'none' });
            persistState({ currentIndex: nextIndex });
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
        poolItemIds,
        navigateBackToSet,
        lastContinueAt,
        persistState,
    ]);

    const handleSelectOption = useCallback(
        (optionId: string) => {
            if (!currentItem) return;
            if (feedback.status !== 'none') return;

            const option = currentItem.options.find((opt) => opt.optionId === optionId);
            if (!option) return;

            const isCorrect = option.isCorrect;

            setSelectedOptionId(optionId);
            setFeedback({ status: isCorrect ? 'correct' : 'incorrect' });

            setStatusByItemId((prev) => {
                const prevStatus = prev[currentItem.itemId] ?? 'unseen';

                // BR-ADP-004 sticky correct: once correct, never regress within journey
                let nextStatus: LearnStatus;
                if (isCorrect) {
                    nextStatus = 'correct';
                } else if (prevStatus === 'correct') {
                    nextStatus = 'correct';
                } else {
                    nextStatus = 'incorrect';
                }

                const nextMap: Record<string, LearnStatus> = {
                    ...prev,
                    [currentItem.itemId]: nextStatus,
                };

                const stats = computeProgress(nextMap, items);
                const safePercent = Math.max(maxProgressPercent, stats.percent);
                setMaxProgressPercent(safePercent);

                persistState({
                    statusByItemId: nextMap,
                    maxProgressPercent: safePercent,
                });

                return nextMap;
            });
        },
        [computeProgress, currentItem, feedback.status, items, maxProgressPercent, persistState]
    );

    const handleSkip = useCallback(() => {
        if (!currentItem) return;
        if (feedback.status !== 'none') return;

        setStatusByItemId((prev) => {
            const prevStatus = prev[currentItem.itemId] ?? 'unseen';

            let nextStatus: LearnStatus;
            if (prevStatus === 'correct') {
                // sticky correct
                nextStatus = 'correct';
            } else {
                nextStatus = 'skipped';
            }

            const nextMap: Record<string, LearnStatus> = {
                ...prev,
                [currentItem.itemId]: nextStatus,
            };

            const stats = computeProgress(nextMap, items);
            const safePercent = Math.max(maxProgressPercent, stats.percent);
            setMaxProgressPercent(safePercent);

            const nextIndex = currentIndex + 1;

            // If skipping last item, we'll transition to complete
            if (nextIndex >= poolItemIds.length) {
                setCurrentIndex(poolItemIds.length);
                persistState({
                    statusByItemId: nextMap,
                    currentIndex: poolItemIds.length,
                    maxProgressPercent: safePercent,
                });
                setStatus('complete');
            } else {
                setCurrentIndex(nextIndex);
                persistState({
                    statusByItemId: nextMap,
                    currentIndex: nextIndex,
                    maxProgressPercent: safePercent,
                });
            }

            return nextMap;
        });

        setSelectedOptionId(null);
        setFeedback({ status: 'none' });
    }, [computeProgress, currentItem, feedback.status, currentIndex, items, maxProgressPercent, persistState, poolItemIds.length]);

    const handleContinue = useCallback(() => {
        if (!currentItem) return;

        const now = Date.now();
        if (lastContinueAt !== null && now - lastContinueAt < 300) {
            return;
        }
        setLastContinueAt(now);

        const isLastItem = currentIndex >= poolItemIds.length - 1;

        if (isLastItem) {
            const newIndex = poolItemIds.length;
            setCurrentIndex(newIndex);
            persistState({ currentIndex: newIndex });
            setStatus('complete');
            return;
        }

        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setSelectedOptionId(null);
        setFeedback({ status: 'none' });
        persistState({ currentIndex: nextIndex });
    }, [currentItem, currentIndex, lastContinueAt, persistState, poolItemIds.length]);

    const handleRetryBuild = useCallback(() => {
        initializeSession(true);
    }, [initializeSession]);

    const handleRestartFromScratch = useCallback(() => {
        clearLearnSession(setId);
        initializeSession(true);
    }, [initializeSession, setId]);

    const totalItems = items.length;
    const progressLabel =
        status === 'ready' && totalItems > 0
            ? `${currentIndex + 1}/${totalItems}`
            : totalItems > 0
            ? `${Math.min(currentIndex, totalItems)}/${totalItems}`
            : '';

    const progressStats = computeProgress(statusByItemId, items);
    const effectiveProgressPercent = Math.max(progressStats.percent, maxProgressPercent);

    const getMotivationalText = (percent: number): string => {
        if (percent >= 100) return 'Tuyệt vời! Bạn đã nắm vững bộ thẻ này.';
        if (percent >= 75) return 'Chỉ còn vài câu nữa thôi!';
        if (percent >= 50) return 'Sắp tới đích rồi, cố lên!';
        if (percent >= 25) return 'Bạn đang tiến bộ rõ rệt.';
        return 'Cứ từ từ, bạn đang làm tốt rồi.';
    };

    const renderProgressBanner = () => {
        if (!set || totalItems === 0) return null;

        return (
            <div
                data-testid="learn-progress-banner"
                className="mb-6 rounded-2xl border border-border bg-card/70 p-4"
            >
                <div className="mb-1 text-sm text-muted">
                    {getMotivationalText(effectiveProgressPercent)}
                </div>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                        <span
                            data-testid="learn-progress-label"
                            className="text-xs font-medium uppercase tracking-wide text-muted"
                        >
                            Tiến độ học
                        </span>
                        <span
                            data-testid="learn-progress-percent"
                            className="text-lg font-semibold text-foreground"
                        >
                            {effectiveProgressPercent}%
                        </span>
                        <span className="text-xs text-muted">
                            Đúng: {progressStats.correct} / {totalItems}
                        </span>
                    </div>
                    <div className="flex-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-300"
                                style={{ width: `${effectiveProgressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
                            className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
                            className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
                        className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Thử lại
                    </button>
                </div>
            </Wrapper>
        );
    }

    // Completion Screen with adaptive variants (BR-CMP + BR-ADP-010..031)
    if (status === 'complete') {
        const summary = progressStats;
        const incorrectOrSkippedCount = items.filter((item) => {
            const s = statusByItemId[item.itemId] ?? 'unseen';
            return s === 'incorrect' || s === 'skipped';
        }).length;

        const hasMistakes = incorrectOrSkippedCount > 0;

        return (
            <Wrapper>
                <div
                    data-testid="learn-complete"
                    className="space-y-6 text-center"
                >
                    {renderProgressBanner()}

                    {hasMistakes ? (
                        <>
                            <h1 className="text-3xl font-bold text-foreground">Chưa xong đâu</h1>
                            <p className="text-sm text-muted">
                                Hãy học lại những câu bạn chưa nắm vững.
                            </p>
                            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    data-testid="learn-retry-wrong"
                                    onClick={() => {
                                        const retryItems = items.filter((item) => {
                                            const s = statusByItemId[item.itemId] ?? 'unseen';
                                            return s === 'incorrect' || s === 'skipped';
                                        });

                                        const ids = retryItems.map((i) => i.itemId);

                                        // Shuffle retry pool for attempt >= 2 (BR-ADP-022)
                                        for (let i = ids.length - 1; i > 0; i--) {
                                            const j = Math.floor(Math.random() * (i + 1));
                                            [ids[i], ids[j]] = [ids[j], ids[i]];
                                        }

                                        const nextAttempt = attempt + 1;

                                        setPoolItemIds(ids);
                                        setCurrentIndex(0);
                                        setAttempt(nextAttempt);
                                        setFeedback({ status: 'none' });
                                        setSelectedOptionId(null);
                                        setStatus('ready');

                                        persistState({
                                            poolItemIds: ids,
                                            currentIndex: 0,
                                            attempt: nextAttempt,
                                        });
                                    }}
                                    className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                >
                                    {`Học lại các câu sai (${incorrectOrSkippedCount})`}
                                </button>
                                <button
                                    type="button"
                                    data-testid="learn-back-to-set"
                                    onClick={navigateBackToSet}
                                    className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                >
                                    Về bộ thẻ
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-foreground">Hoàn thành</h1>
                            <p className="text-sm text-muted">
                                Tuyệt vời! Bạn đã nắm vững bộ thẻ này.
                            </p>
                            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    data-testid="learn-restart-from-scratch"
                                    onClick={handleRestartFromScratch}
                                    className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                >
                                    Học lại từ đầu
                                </button>
                                <button
                                    type="button"
                                    data-testid="learn-back-to-set"
                                    onClick={navigateBackToSet}
                                    className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                >
                                    Về bộ thẻ
                                </button>
                            </div>
                        </>
                    )}
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
            {renderProgressBanner()}
            {/* Top bar */}
            <div className="mb-6 flex items-center justify-between">
                <button
                    type="button"
                    onClick={navigateBackToSet}
                    className="inline-flex items-center text-sm text-muted hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
                        'w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer';

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
                    className="text-sm text-muted hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    Bỏ qua
                </button>

                {isFeedbackState && (
                    <button
                        type="button"
                        data-testid="learn-continue"
                        ref={continueButtonRef}
                        onClick={handleContinue}
                        className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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


