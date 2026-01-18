/**
 * CardId Value Object
 * 
 * Represents a unique identifier for a flashcard.
 */
export class CardId {
    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static create(): CardId {
        const id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return new CardId(id);
    }

    static fromString(value: string): CardId {
        if (!value || value.trim().length === 0) {
            throw new Error('CardId cannot be empty');
        }
        return new CardId(value);
    }

    toString(): string {
        return this.value;
    }

    equals(other: CardId): boolean {
        return this.value === other.value;
    }
}
