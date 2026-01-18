import { CardId } from '../value-objects/CardId';

/**
 * Card Entity
 * 
 * Represents a single flashcard with a term and definition.
 * This is an aggregate root in the domain model.
 */
export interface CardProps {
    id: CardId;
    term: string;
    definition: string;
    position: number;
    createdAt: Date;
    updatedAt: Date;
}

export class Card {
    private props: CardProps;

    private constructor(props: CardProps) {
        this.props = props;
    }

    /**
     * Factory method to create a new Card
     */
    static create(term: string, definition: string, position: number = 0): Card {
        // Business rule: term and definition are required
        if (!term || term.trim().length === 0) {
            throw new Error('Card term is required');
        }

        if (!definition || definition.trim().length === 0) {
            throw new Error('Card definition is required');
        }

        // TODO(business): Add validation for maximum length
        // TODO(business): Consider validating against duplicate terms in the same set

        const now = new Date();
        return new Card({
            id: CardId.create(),
            term: term.trim(),
            definition: definition.trim(),
            position,
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * Reconstitute a Card from persistence
     */
    static fromPersistence(props: CardProps): Card {
        return new Card(props);
    }

    // Getters
    get id(): CardId {
        return this.props.id;
    }

    get term(): string {
        return this.props.term;
    }

    get definition(): string {
        return this.props.definition;
    }

    get position(): number {
        return this.props.position;
    }

    get createdAt(): Date {
        return this.props.createdAt;
    }

    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    /**
     * Update the card's term and definition
     */
    update(term: string, definition: string): void {
        if (!term || term.trim().length === 0) {
            throw new Error('Card term is required');
        }

        if (!definition || definition.trim().length === 0) {
            throw new Error('Card definition is required');
        }

        this.props.term = term.trim();
        this.props.definition = definition.trim();
        this.props.updatedAt = new Date();
    }

    /**
     * Update the card's position in the set
     */
    updatePosition(position: number): void {
        if (position < 0) {
            throw new Error('Position must be non-negative');
        }
        this.props.position = position;
        this.props.updatedAt = new Date();
    }

    /**
     * Convert to plain object for persistence
     */
    toPersistence(): CardProps {
        return {
            ...this.props,
        };
    }
}
