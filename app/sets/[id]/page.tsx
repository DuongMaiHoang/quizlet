'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SetDTO } from '@/application/dto/SetDTO';
import { container } from '@/lib/di';
import { LoadingState } from '@/ui/components/common/LoadingState';
import { ErrorState } from '@/ui/components/common/ErrorState';
import { BookOpen, Edit, Trash2, Brain, Zap, FileText, Plus } from 'lucide-react';
import { SmartText } from '@/ui/components/common/SmartText';
import { HanziBoostSettings } from '@/ui/components/settings/HanziBoostSettings';

/**
 * Set Detail Page
 * 
 * Shows set information and study mode options
 */
export default function SetDetailPage() {
    const params = useParams();
    const router = useRouter();
    const setId = params.id as string;

    const [set, setSet] = useState<SetDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

            setSet(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load set');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!set) return;

        if (confirm(`Are you sure you want to delete "${set.title}"?`)) {
            try {
                const deleteSet = container.deleteSet;
                await deleteSet.execute(setId);
                router.push('/');
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to delete set');
            }
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
                        href="/"
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors"
                    >
                        Go Home
                    </Link>
                }
            />
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h1 className="text-4xl font-bold text-foreground">
                            <SmartText text={set.title} />
                        </h1>
                        {set.description && (
                            <p className="mt-2 text-lg text-muted">
                                <SmartText text={set.description} />
                            </p>
                        )}
                        <div className="mt-4 flex items-center space-x-4 text-sm text-muted">
                            <div className="flex items-center space-x-1">
                                <BookOpen className="h-4 w-4" />
                                <span>{set.cardCount} {set.cardCount === 1 ? 'card' : 'cards'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <HanziBoostSettings />
                        <Link
                            href={`/sets/${setId}/edit?action=addCard`}
                            className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Card
                        </Link>
                        <Link
                            href={`/sets/${setId}/edit`}
                            className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center rounded-lg border border-error px-4 py-2 text-sm font-medium text-error hover:bg-error/10 transition-colors"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* Study Modes */}
            <div className="grid gap-4 md:grid-cols-3">
                <Link
                    href={`/study/${setId}/flashcards`}
                    className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:bg-card-hover hover:shadow-lg"
                >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        Flashcards
                    </h3>
                    <p className="text-sm text-muted">
                        Review cards one by one with flip animations
                    </p>
                </Link>

                <Link
                    href={`/study/${setId}/learn`}
                    className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:bg-card-hover hover:shadow-lg"
                >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                        <Brain className="h-6 w-6 text-secondary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        Học
                    </h3>
                    <p className="text-sm text-muted">
                        Luyện tập trắc nghiệm và xem đáp án đúng
                    </p>
                </Link>

                <Link
                    href={`/sets/${setId}/study/test`}
                    className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:bg-card-hover hover:shadow-lg"
                >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                        <FileText className="h-6 w-6 text-success" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        Test
                    </h3>
                    <p className="text-sm text-muted">
                        Take a practice test with mixed questions
                    </p>
                </Link>
            </div>

            {/* Cards List */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Cards in this set</h2>
                <div className="space-y-3">
                    {set.cards.map((card, index) => (
                        <div
                            key={card.id}
                            className="rounded-xl border border-border bg-card p-6"
                        >
                            <div className="mb-2 text-sm font-medium text-muted">
                                Card {index + 1}
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <div className="mb-1 text-xs font-medium uppercase text-muted">
                                        Term
                                    </div>
                                    <div className="text-foreground">
                                        <SmartText text={card.term} />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-1 text-xs font-medium uppercase text-muted">
                                        Definition
                                    </div>
                                    <div className="text-foreground">
                                        <SmartText text={card.definition} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
