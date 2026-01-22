'use client';

import { CardSide } from '@/domain/entities/FlashcardsProgress';

interface FlashcardProps {
    term: string;
    definition: string;
    side: CardSide;
    onFlip: () => void;
}

/**
 * Flashcard Component
 * 
 * Displays a flipable card with term/definition.
 * BR-FLIP-01: Click to flip, BR-FLIP-02: Space to flip
 */
export function Flashcard({ term, definition, side, onFlip }: FlashcardProps) {
    const displayTerm = term.trim() || '(No term)';
    const displayDefinition = definition.trim() || '(No definition)';

    return (
        <div
            data-testid="flashcard-card"
            className="group relative h-96 cursor-pointer"
            onClick={onFlip}
            onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onFlip();
                }
            }}
            tabIndex={0}
            role="button"
            aria-label="Flip card"
        >
            <div
                className={`absolute inset-0 transition-all duration-300 ${side === 'definition' ? '[transform:rotateY(180deg)]' : ''
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
                    <div data-testid="flashcard-term" className="text-3xl font-bold text-foreground">
                        {displayTerm}
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
                    <div data-testid="flashcard-definition" className="text-2xl font-semibold text-foreground">
                        {displayDefinition}
                    </div>
                    <div className="mt-8 text-sm text-muted">
                        Click to flip back or Press Space
                    </div>
                </div>
            </div>
        </div>
    );
}
