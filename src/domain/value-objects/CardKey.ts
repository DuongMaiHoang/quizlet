/**
 * CardKey Value Object
 * 
 * Represents a unique key for identifying a card in flashcards progress.
 * Uses card.id if available, otherwise uses deterministic key: setId::indexInOriginal
 * 
 * BR-PERSIST-01: CardKey must be stable across sessions
 */
export class CardKey {
    private readonly value: string;

    private constructor(value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('CardKey cannot be empty');
        }
        this.value = value;
    }

    /**
     * Create CardKey from card ID (preferred method)
     */
    static fromCardId(cardId: string): CardKey {
        return new CardKey(cardId);
    }

    /**
     * Create CardKey from setId and index (fallback when card has no ID)
     */
    static fromSetIdAndIndex(setId: string, indexInOriginal: number): CardKey {
        return new CardKey(`${setId}::${indexInOriginal}`);
    }

    /**
     * Create CardKey from string (for deserialization)
     */
    static fromString(value: string): CardKey {
        return new CardKey(value);
    }

    toString(): string {
        return this.value;
    }

    equals(other: CardKey): boolean {
        return this.value === other.value;
    }
}
