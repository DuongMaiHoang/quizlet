import { Card } from '../entities/Card';
import { Set } from '../entities/Set';

/**
 * Question types for test mode
 */
export enum QuestionType {
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
    WRITTEN = 'WRITTEN',
}

/**
 * Test question interface
 */
export interface TestQuestion {
    cardId: string;
    type: QuestionType;
    question: string;
    correctAnswer: string;
    choices?: string[]; // For multiple choice
    position: number;
}

/**
 * TestGenerator Service
 * 
 * Domain service responsible for generating test questions from a set.
 * Encapsulates the business logic for test creation.
 */
export class TestGenerator {
    /**
     * Generate a test from a set
     * 
     * Creates a mix of multiple choice and written questions
     * 
     * @param set - The study set to generate questions from
     * @param questionCount - Number of questions to generate (default: all cards)
     * @param multipleChoiceRatio - Ratio of multiple choice questions (0-1, default: 0.5)
     * @returns Array of test questions
     * 
     * TODO(business): Add difficulty levels
     * TODO(business): Implement adaptive question selection based on past performance
     * TODO(business): Support different question formats (matching, true/false, etc.)
     */
    static generate(
        set: Set,
        questionCount?: number,
        multipleChoiceRatio: number = 0.5
    ): TestQuestion[] {
        const cards = set.cards;

        if (cards.length === 0) {
            throw new Error('Cannot generate test from empty set');
        }

        // Determine how many questions to generate
        const count = questionCount ?? cards.length;
        const actualCount = Math.min(count, cards.length);

        // Shuffle and select cards
        const selectedCards = this.selectRandomCards(cards, actualCount);

        // Determine split between multiple choice and written
        const mcCount = Math.floor(actualCount * multipleChoiceRatio);
        const writtenCount = actualCount - mcCount;

        const questions: TestQuestion[] = [];

        // Generate multiple choice questions
        for (let i = 0; i < mcCount; i++) {
            const card = selectedCards[i];
            questions.push(this.generateMultipleChoiceQuestion(card, cards, i));
        }

        // Generate written questions
        for (let i = mcCount; i < actualCount; i++) {
            const card = selectedCards[i];
            questions.push(this.generateWrittenQuestion(card, i));
        }

        // Shuffle questions
        return this.shuffleArray(questions).map((q, index) => ({
            ...q,
            position: index,
        }));
    }

    /**
     * Generate a multiple choice question
     * 
     * Shows the term, asks for the definition
     * 
     * TODO(business): Support reverse (show definition, ask for term)
     * TODO(business): Make number of choices configurable
     */
    private static generateMultipleChoiceQuestion(
        card: Card,
        allCards: readonly Card[],
        position: number
    ): TestQuestion {
        const correctAnswer = card.definition;

        // Get 3 random incorrect answers from other cards
        const otherCards = allCards.filter(c => !c.id.equals(card.id));
        const incorrectChoices = this.selectRandomCards(otherCards, 3)
            .map(c => c.definition);

        // Combine and shuffle choices
        const choices = this.shuffleArray([correctAnswer, ...incorrectChoices]);

        return {
            cardId: card.id.toString(),
            type: QuestionType.MULTIPLE_CHOICE,
            question: card.term,
            correctAnswer,
            choices,
            position,
        };
    }

    /**
     * Generate a written question
     * 
     * Shows the term, user must type the definition
     */
    private static generateWrittenQuestion(
        card: Card,
        position: number
    ): TestQuestion {
        return {
            cardId: card.id.toString(),
            type: QuestionType.WRITTEN,
            question: card.term,
            correctAnswer: card.definition,
            position,
        };
    }

    /**
     * Select random cards from an array
     */
    private static selectRandomCards(cards: readonly Card[], count: number): Card[] {
        const shuffled = this.shuffleArray([...cards]);
        return shuffled.slice(0, count);
    }

    /**
     * Shuffle an array using Fisher-Yates algorithm
     */
    private static shuffleArray<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}
