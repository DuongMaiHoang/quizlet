import { SetId } from '../value-objects/SetId';
import { CardId } from '../value-objects/CardId';

/**
 * StudyMode enum
 * 
 * Defines the different study modes available
 */
export enum StudyMode {
    FLASHCARDS = 'FLASHCARDS',
    LEARN = 'LEARN',
    TEST = 'TEST',
}

/**
 * CardResult interface
 * 
 * Tracks the result for a single card in a study session
 */
export interface CardResult {
    cardId: CardId;
    correct: boolean;
    attempts: number;
    timestamp: Date;
}

/**
 * StudySession Entity
 * 
 * Tracks progress and results during a study session.
 * This entity manages the state of an active or completed study session.
 */
export interface StudySessionProps {
    setId: SetId;
    mode: StudyMode;
    cardIds: CardId[];
    currentIndex: number;
    results: CardResult[];
    startedAt: Date;
    completedAt?: Date;
}

export class StudySession {
    private props: StudySessionProps;

    private constructor(props: StudySessionProps) {
        this.props = props;
    }

    /**
     * Factory method to create a new study session
     */
    static create(setId: SetId, mode: StudyMode, cardIds: CardId[]): StudySession {
        if (cardIds.length === 0) {
            throw new Error('Cannot create study session with no cards');
        }

        // TODO(business): Add validation for minimum cards per mode
        // For example, Test mode might require at least 4 cards for multiple choice

        return new StudySession({
            setId,
            mode,
            cardIds,
            currentIndex: 0,
            results: [],
            startedAt: new Date(),
        });
    }

    /**
     * Reconstitute from persistence
     */
    static fromPersistence(props: StudySessionProps): StudySession {
        return new StudySession(props);
    }

    // Getters
    get setId(): SetId {
        return this.props.setId;
    }

    get mode(): StudyMode {
        return this.props.mode;
    }

    get currentIndex(): number {
        return this.props.currentIndex;
    }

    get currentCardId(): CardId | undefined {
        return this.props.cardIds[this.props.currentIndex];
    }

    get totalCards(): number {
        return this.props.cardIds.length;
    }

    get results(): readonly CardResult[] {
        return [...this.props.results];
    }

    get startedAt(): Date {
        return this.props.startedAt;
    }

    get completedAt(): Date | undefined {
        return this.props.completedAt;
    }

    /**
     * Check if the session is complete
     */
    isComplete(): boolean {
        return this.props.currentIndex >= this.props.cardIds.length;
    }

    /**
     * Move to the next card
     */
    next(): void {
        if (this.isComplete()) {
            throw new Error('Study session is already complete');
        }

        this.props.currentIndex++;

        if (this.isComplete()) {
            this.props.completedAt = new Date();
        }
    }

    /**
     * Move to the previous card
     */
    previous(): void {
        if (this.props.currentIndex === 0) {
            throw new Error('Already at the first card');
        }

        this.props.currentIndex--;

        // If we go back, remove the completion timestamp
        if (this.props.completedAt) {
            this.props.completedAt = undefined;
        }
    }

    /**
     * Jump to a specific card index
     */
    jumpTo(index: number): void {
        if (index < 0 || index >= this.props.cardIds.length) {
            throw new Error('Invalid card index');
        }

        this.props.currentIndex = index;

        // Update completion status
        if (index >= this.props.cardIds.length - 1 && !this.props.completedAt) {
            this.props.completedAt = new Date();
        } else if (index < this.props.cardIds.length - 1 && this.props.completedAt) {
            this.props.completedAt = undefined;
        }
    }

    /**
     * Record the result for the current card
     * 
     * NOTE: This is used in Learn and Test modes to track correctness
     */
    recordResult(cardId: CardId, correct: boolean): void {
        // Verify we're recording for the current card
        const currentCard = this.currentCardId;
        if (!currentCard || !currentCard.equals(cardId)) {
            throw new Error('Cannot record result for non-current card');
        }

        // Check if we already have a result for this card
        const existingResult = this.props.results.find(r => r.cardId.equals(cardId));

        if (existingResult) {
            // Update existing result
            existingResult.correct = correct;
            existingResult.attempts++;
            existingResult.timestamp = new Date();
        } else {
            // Add new result
            this.props.results.push({
                cardId,
                correct,
                attempts: 1,
                timestamp: new Date(),
            });
        }
    }

    /**
     * Get progress statistics
     * 
     * Returns the number and percentage of correct/incorrect answers
     */
    getProgress(): {
        total: number;
        answered: number;
        correct: number;
        incorrect: number;
        percentComplete: number;
        percentCorrect: number;
    } {
        const total = this.props.cardIds.length;
        const answered = this.props.results.length;
        const correct = this.props.results.filter(r => r.correct).length;
        const incorrect = answered - correct;

        return {
            total,
            answered,
            correct,
            incorrect,
            percentComplete: total > 0 ? Math.round((answered / total) * 100) : 0,
            percentCorrect: answered > 0 ? Math.round((correct / answered) * 100) : 0,
        };
    }

    /**
     * Get cards that were answered incorrectly
     * 
     * TODO(business): Use this to implement "study incorrect cards" feature
     */
    getIncorrectCardIds(): CardId[] {
        return this.props.results
            .filter(r => !r.correct)
            .map(r => r.cardId);
    }

    /**
     * Calculate final score (for Test mode)
     */
    getScore(): number {
        const progress = this.getProgress();
        return progress.percentCorrect;
    }

    /**
     * Convert to plain object for persistence
     */
    toPersistence(): StudySessionProps {
        return {
            ...this.props,
        };
    }
}
