'use client';

import { useRouter } from 'next/navigation';
import { SetForm } from '@/ui/components/sets/SetForm';
import { container } from '@/lib/di';
import { CreateCardDTO } from '@/application/dto/SetDTO';

/**
 * Create Set Page
 * 
 * Page for creating a new study set
 */
export default function CreateSetPage() {
    const router = useRouter();

    const handleSubmit = async (
        title: string,
        description: string,
        cards: CreateCardDTO[]
    ) => {
        // Create the set
        const createSet = container.createSet;
        const set = await createSet.execute(title, description);

        // Add cards to the set
        const addCard = container.addCard;
        for (const card of cards) {
            await addCard.execute(set.id, card.term, card.definition);
        }

        // Navigation (BR-UX-04)
        router.push(`/sets/${set.id}`);
    };

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Create a New Set</h1>
                <p className="mt-2 text-muted">
                    Add a title, description, and cards to create your study set
                </p>
            </div>

            <SetForm onSubmit={handleSubmit} submitLabel="Create Set" />
        </div>
    );
}
