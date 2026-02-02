'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { SetForm } from '@/ui/components/sets/SetForm';
import { container } from '@/lib/di';
import { SetDTO, CreateCardDTO } from '@/application/dto/SetDTO';
import { LoadingState } from '@/ui/components/common/LoadingState';
import { ErrorState } from '@/ui/components/common/ErrorState';
import Link from 'next/link';

/**
 * Edit Set Page
 * 
 * Page for editing an existing study set
 */
export default function EditSetPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const setId = params.id as string;
    const shouldAddCard = searchParams.get('action') === 'addCard';

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

    const handleSubmit = async (
        title: string,
        description: string,
        cards: CreateCardDTO[]
    ) => {
        // Update set info
        const updateSet = container.updateSet;
        await updateSet.execute(setId, title, description);

        // For simplicity, we'll delete all existing cards and add new ones
        // TODO(business): Implement smarter card update logic (update existing, add new, remove deleted)
        const deleteCard = container.deleteCard;
        const addCard = container.addCard;

        if (set) {
            // Delete existing cards
            for (const card of set.cards) {
                await deleteCard.execute(setId, card.id);
            }
        }

        // Add new cards
        for (const card of cards) {
            await addCard.execute(setId, card.term, card.definition);
        }

        // Navigation (BR-UX-04)
        router.push(`/sets/${setId}`);
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
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                    >
                        Go Home
                    </Link>
                }
            />
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Edit Set</h1>
                <p className="mt-2 text-muted">
                    Update your study set's information and cards
                </p>
            </div>

            <SetForm
                initialTitle={set.title}
                initialDescription={set.description}
                initialCards={set.cards.map((c) => ({ term: c.term, definition: c.definition }))}
                onSubmit={handleSubmit}
                submitLabel="Save Changes"
                setId={setId}
                autoAddCard={shouldAddCard}
            />
        </div>
    );
}
