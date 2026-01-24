'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateCardDTO } from '@/application/dto/SetDTO';
import { X, Plus, GripVertical, Import, CheckCircle2 } from 'lucide-react';
import { ImportOverlay } from './ImportOverlay';
import { useEffect } from 'react';

interface SetFormProps {
    initialTitle?: string;
    initialDescription?: string;
    initialCards?: CreateCardDTO[];
    onSubmit: (title: string, description: string, cards: CreateCardDTO[]) => Promise<void>;
    submitLabel?: string;
    setId?: string; // For draft autosave keying
}

/**
 * SetForm Component
 * 
 * Form for creating or editing a study set with cards
 */
export function SetForm({
    initialTitle = '',
    initialDescription = '',
    initialCards = [],
    onSubmit,
    submitLabel = 'Create Set',
    setId,
}: SetFormProps) {
    const router = useRouter();
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [cards, setCards] = useState<CreateCardDTO[]>(
        initialCards.length > 0 ? initialCards : [{ term: '', definition: '' }]
    );
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showImport, setShowImport] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // Clear toast after 3 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleImport = (importedCards: CreateCardDTO[]) => {
        // BR-IMP-41: Append logic
        setCards((prev) => [...prev, ...importedCards]);
        setToast({ msg: `Đã thêm ${importedCards.length} thẻ`, type: 'success' });
        setShowImport(false);

        // Scroll to bottom (where new cards are)
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
    };

    const handleAddCard = () => {
        setCards([...cards, { term: '', definition: '' }]);
    };

    const handleRemoveCard = (index: number) => {
        if (cards.length === 1) {
            return; // Keep at least one card
        }
        setCards(cards.filter((_, i) => i !== index));
    };

    const handleCardChange = (
        index: number,
        field: 'term' | 'definition',
        value: string
    ) => {
        const newCards = [...cards];
        newCards[index][field] = value;
        setCards(newCards);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        const validCards = cards.filter((c) => c.term.trim() && c.definition.trim());
        if (validCards.length === 0) {
            setError('At least one card with term and definition is required');
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit(title, description, validCards);
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save set');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                    <div className="rounded-lg border border-error bg-error/10 p-4 text-sm text-error">
                        {error}
                    </div>
                )}

                {/* Set Info */}
                <div className="space-y-4 rounded-xl border border-border bg-card p-6">
                    <div>
                        <label htmlFor="title" className="mb-2 block text-sm font-medium text-foreground">
                            Title *
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter a title for your set"
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="mb-2 block text-sm font-medium text-foreground">
                            Description (optional)
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description..."
                            rows={3}
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Cards */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Cards</h2>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowImport(true)}
                                className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                <Import className="mr-2 h-4 w-4" />
                                Nhập nhanh hàng loạt
                            </button>
                            <button
                                type="button"
                                onClick={handleAddCard}
                                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Card
                            </button>
                        </div>
                    </div>

                    {/* Empty State CTA for Import */}
                    {cards.length === 0 || (cards.length === 1 && !cards[0].term && !cards[0].definition) ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
                            <p className="mb-4 text-muted-foreground">Bắt đầu bằng cách thêm câu hỏi thủ công hoặc nhập danh sách.</p>
                            <button
                                type="button"
                                onClick={() => setShowImport(true)}
                                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                <Import className="mr-2 h-4 w-4" />
                                Dán nội dung để tạo thẻ
                            </button>
                        </div>
                    ) : null}

                    {cards.map((card, index) => (
                        <div
                            key={index}
                            className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30"
                        >
                            {/* Card Number & Delete */}
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <GripVertical className="h-5 w-5 text-muted" />
                                    <span className="text-sm font-medium text-muted">Card {index + 1}</span>
                                </div>
                                {cards.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveCard(index)}
                                        className="rounded-lg p-2 text-muted hover:bg-error/10 hover:text-error transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-error/20 cursor-pointer"
                                        aria-label={`Remove card ${index + 1}`}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Term & Definition */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">
                                        Term
                                    </label>
                                    <input
                                        type="text"
                                        value={card.term}
                                        onChange={(e) => handleCardChange(index, 'term', e.target.value)}
                                        placeholder="Enter term"
                                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-foreground">
                                        Definition
                                    </label>
                                    <input
                                        type="text"
                                        value={card.definition}
                                        onChange={(e) => handleCardChange(index, 'definition', e.target.value)}
                                        placeholder="Enter definition"
                                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-lg border border-border px-6 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {submitting ? 'Saving...' : submitLabel}
                    </button>
                </div>
            </form>

            {/* Import Overlay */}
            {
                showImport && (
                    <ImportOverlay
                        onImport={handleImport}
                        onClose={() => setShowImport(false)}
                        setId={setId}
                    />
                )
            }

            {/* Toast Notification */}
            {
                toast && (
                    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-foreground px-4 py-3 text-background shadow-lg animate-in slide-in-from-bottom-5">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <span className="font-medium">{toast.msg}</span>
                    </div>
                )
            }
        </>
    );
}
