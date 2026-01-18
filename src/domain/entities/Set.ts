import { SetId } from '../value-objects/SetId';
import { Card, CardProps } from './Card';
import { CardId } from '../value-objects/CardId';

/**
 * Set Entity
 * 
 * Represents a study set containing multiple flashcards.
 * This is the main aggregate root for the flashcard domain.
 */
export interface SetProps {
    id: SetId;
    title: string;
    description: string;
    cards: Card[];
    createdAt: Date;
    updatedAt: Date;
}

export class Set {
    private props: SetProps;

    // Business rule: maximum cards per set
    private static readonly MAX_CARDS = 500;

    private constructor(props: SetProps) {
        this.props = props;
    }

    /**
     * Factory method to create a new Set
     */
    static create(title: string, description: string = ''): Set {
        // Business rule: title is required and must have minimum length
        if (!title || title.trim().length === 0) {
            throw new Error('Set title is required');
        }

        if (title.trim().length < 1) {
            throw new Error('Set title must be at least 1 character');
        }

        // TODO(business): Add validation for maximum title length
        // TODO(business): Consider validating against profanity or inappropriate content

        const now = new Date();
        return new Set({
            id: SetId.create(),
            title: title.trim(),
            description: description.trim(),
            cards: [],
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * Reconstitute a Set from persistence
     */
    static fromPersistence(props: Omit<SetProps, 'cards'> & { cards: CardProps[] }): Set {
        const cards = props.cards.map(cardProps => Card.fromPersistence(cardProps));
        return new Set({
            ...props,
            cards,
        });
    }

    // Getters
    get id(): SetId {
        return this.props.id;
    }

    get title(): string {
        return this.props.title;
    }

    get description(): string {
        return this.props.description;
    }

    get cards(): readonly Card[] {
        return [...this.props.cards];
    }

    get cardCount(): number {
        return this.props.cards.length;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    /**
     * Update the set's title and description
     */
    update(title: string, description: string): void {
        if (!title || title.trim().length === 0) {
            throw new Error('Set title is required');
        }

        this.props.title = title.trim();
        this.props.description = description.trim();
        this.props.updatedAt = new Date();
    }

    /**
     * Add a card to the set
     * 
     * NOTE: Business rule - enforce maximum cards limit
     */
    addCard(card: Card): void {
        if (this.props.cards.length >= Set.MAX_CARDS) {
            throw new Error(`Cannot add more than ${Set.MAX_CARDS} cards to a set`);
        }

        // Set the position to the end of the list
        card.updatePosition(this.props.cards.length);
        this.props.cards.push(card);
        this.props.updatedAt = new Date();
    }

    /**
     * Remove a card from the set
     */
    removeCard(cardId: CardId): void {
        const index = this.props.cards.findIndex(c => c.id.equals(cardId));

        if (index === -1) {
            throw new Error('Card not found in set');
        }

        this.props.cards.splice(index, 1);

        // Reorder remaining cards
        this.reorderCards();
        this.props.updatedAt = new Date();
    }

    /**
     * Update an existing card in the set
     */
    updateCard(cardId: CardId, term: string, definition: string): void {
        const card = this.props.cards.find(c => c.id.equals(cardId));

        if (!card) {
            throw new Error('Card not found in set');
        }

        card.update(term, definition);
        this.props.updatedAt = new Date();
    }

    /**
     * Get a card by ID
     */
    getCard(cardId: CardId): Card | undefined {
        return this.props.cards.find(c => c.id.equals(cardId));
    }

    /**
     * Shuffle the cards in the set
     * Returns a new array of shuffled cards without modifying the original order
     */
    getShuffledCards(): Card[] {
        const shuffled = [...this.props.cards];

        // Fisher-Yates shuffle algorithm
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled;
    }

    /**
     * Reorder cards to maintain sequential positions
     */
    private reorderCards(): void {
        this.props.cards.forEach((card, index) => {
            card.updatePosition(index);
        });
    }

    /**
     * Check if the set is ready for study
     * 
     * NOTE: Business rule - need at least 1 card to study
     * TODO(business): Consider minimum card requirements for different study modes
     */
    canStudy(): boolean {
        return this.props.cards.length > 0;
    }

    /**
     * Convert to plain object for persistence
     */
    toPersistence(): Omit<SetProps, 'cards'> & { cards: CardProps[] } {
        return {
            id: this.props.id,
            title: this.props.title,
            description: this.props.description,
            cards: this.props.cards.map(card => card.toPersistence()),
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt,
        };
    }
}
