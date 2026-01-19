import { SetId } from '../value-objects/SetId';
import { CardKey } from '../value-objects/CardKey';

/**
 * Card Status
 * 
 * BR-KNOW-01, BR-LEARN-01, BR-SET-01, BR-SET-02
 */
export type CardStatus = 'know' | 'learning' | 'unset';

/**
 * Order Mode
 * 
 * BR-SHUFF-01, BR-SHUFF-02, BR-SHUFF-03
 */
export type OrderMode = 'original' | 'shuffled';

/**
 * Card Side
 * 
 * BR-FLIP-01, BR-FLIP-02, BR-FLIP-03
 */
export type CardSide = 'term' | 'definition';

/**
 * FlashcardsProgress Entity
 * 
 * Represents the progress state for a flashcards study session.
 * This is persisted per setId in localStorage.
 * 
 * BR-PERSIST-01, BR-PERSIST-02, BR-PERSIST-03
 */
export interface FlashcardsProgressProps {
    setId: SetId;
    order: OrderMode;
    shuffledOrder?: string[]; // Array of CardKey strings for stable shuffle
    shuffledSeed?: string; // Alternative: seed for deterministic shuffle
    index: number; // Current card index (0-based)
    side: CardSide; // Current card side
    knownMap: Record<string, CardStatus>; // CardKey -> CardStatus
    lastUpdatedAt: Date;
}

export class FlashcardsProgress {
    private props: FlashcardsProgressProps;

    private constructor(props: FlashcardsProgressProps) {
        this.props = props;
    }

    /**
     * Create new progress for a set
     */
    static create(setId: SetId): FlashcardsProgress {
        return new FlashcardsProgress({
            setId,
            order: 'original',
            index: 0,
            side: 'term', // BR-FLIP-03: Default to term
            knownMap: {},
            lastUpdatedAt: new Date(),
        });
    }

    /**
     * Reconstitute from persistence
     */
    static fromPersistence(props: Omit<FlashcardsProgressProps, 'setId' | 'lastUpdatedAt'> & {
        setId: string;
        lastUpdatedAt: string;
    }): FlashcardsProgress {
        return new FlashcardsProgress({
            setId: SetId.fromString(props.setId),
            order: props.order,
            shuffledOrder: props.shuffledOrder,
            shuffledSeed: props.shuffledSeed,
            index: props.index,
            side: props.side,
            knownMap: props.knownMap,
            lastUpdatedAt: new Date(props.lastUpdatedAt),
        });
    }

    // Getters
    get setId(): SetId {
        return this.props.setId;
    }

    get order(): OrderMode {
        return this.props.order;
    }

    get shuffledOrder(): string[] | undefined {
        return this.props.shuffledOrder;
    }

    get shuffledSeed(): string | undefined {
        return this.props.shuffledSeed;
    }

    get index(): number {
        return this.props.index;
    }

    get side(): CardSide {
        return this.props.side;
    }

    get knownMap(): Record<string, CardStatus> {
        return { ...this.props.knownMap };
    }

    get lastUpdatedAt(): Date {
        return this.props.lastUpdatedAt;
    }

    /**
     * Get status for a card
     */
    getCardStatus(cardKey: CardKey): CardStatus {
        return this.props.knownMap[cardKey.toString()] || 'unset';
    }

    /**
     * Mark card as Know
     * BR-KNOW-01
     */
    markKnow(cardKey: CardKey): void {
        this.props.knownMap[cardKey.toString()] = 'know';
        this.props.lastUpdatedAt = new Date();
    }

    /**
     * Mark card as Still learning
     * BR-LEARN-01
     */
    markLearning(cardKey: CardKey): void {
        this.props.knownMap[cardKey.toString()] = 'learning';
        this.props.lastUpdatedAt = new Date();
    }

    /**
     * Unset card status
     * BR-SET-02
     */
    unsetCard(cardKey: CardKey): void {
        delete this.props.knownMap[cardKey.toString()];
        this.props.lastUpdatedAt = new Date();
    }

    /**
     * Set card status (overwrites existing)
     * BR-SET-01
     */
    setCardStatus(cardKey: CardKey, status: CardStatus): void {
        if (status === 'unset') {
            this.unsetCard(cardKey);
        } else {
            this.props.knownMap[cardKey.toString()] = status;
            this.props.lastUpdatedAt = new Date();
        }
    }

    /**
     * Set order mode and reset index/side
     * BR-SHUFF-01, BR-SHUFF-02
     */
    setOrder(order: OrderMode, shuffledOrder?: string[], shuffledSeed?: string): void {
        this.props.order = order;
        this.props.shuffledOrder = shuffledOrder;
        this.props.shuffledSeed = shuffledSeed;
        this.props.index = 0; // Reset to first card
        this.props.side = 'term'; // Reset to term side
        this.props.lastUpdatedAt = new Date();
    }

    /**
     * Set current index and reset side to term
     * BR-NAV-01, BR-NAV-02
     */
    setIndex(index: number): void {
        this.props.index = index;
        this.props.side = 'term'; // BR-FLIP-03: Reset to term on navigation
        this.props.lastUpdatedAt = new Date();
    }

    /**
     * Flip card side
     * BR-FLIP-01, BR-FLIP-02
     */
    flip(): void {
        this.props.side = this.props.side === 'term' ? 'definition' : 'term';
        this.props.lastUpdatedAt = new Date();
    }

    /**
     * Reset progress (clear knownMap, reset order/index/side)
     * BR-RESET-02
     */
    reset(): void {
        this.props.knownMap = {};
        this.props.order = 'original';
        this.props.shuffledOrder = undefined;
        this.props.shuffledSeed = undefined;
        this.props.index = 0;
        this.props.side = 'term';
        this.props.lastUpdatedAt = new Date();
    }

    /**
     * Get counts for progress stats
     * BR-PROG-02
     */
    getStats(): { known: number; learning: number; unset: number } {
        const statuses = Object.values(this.props.knownMap);
        return {
            known: statuses.filter(s => s === 'know').length,
            learning: statuses.filter(s => s === 'learning').length,
            unset: statuses.filter(s => s === 'unset').length,
        };
    }

    /**
     * Convert to persistence format
     */
    toPersistence(): Omit<FlashcardsProgressProps, 'setId' | 'lastUpdatedAt'> & {
        setId: string;
        lastUpdatedAt: string;
    } {
        return {
            setId: this.props.setId.toString(),
            order: this.props.order,
            shuffledOrder: this.props.shuffledOrder,
            shuffledSeed: this.props.shuffledSeed,
            index: this.props.index,
            side: this.props.side,
            knownMap: this.props.knownMap,
            lastUpdatedAt: this.props.lastUpdatedAt.toISOString(),
        };
    }
}
