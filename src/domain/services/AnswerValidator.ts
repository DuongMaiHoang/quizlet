import { Answer } from '../value-objects/Answer';

/**
 * AnswerValidator Service
 * 
 * Domain service responsible for validating user answers.
 * Encapsulates the business logic for answer correctness.
 */
export class AnswerValidator {
    /**
     * Validate if a user's answer matches the expected answer
     * 
     * Current implementation: case-insensitive exact match with trimming
     * 
     * @param userAnswer - The answer provided by the user
     * @param correctAnswer - The expected correct answer
     * @returns true if the answer is correct, false otherwise
     * 
     * TODO(business): Implement fuzzy matching for typos (e.g., Levenshtein distance)
     * TODO(business): Support multiple acceptable answers (synonyms)
     * TODO(business): Add partial credit scoring
     * TODO(business): Consider language-specific rules (accents, special characters)
     */
    static validate(userAnswer: string, correctAnswer: string): boolean {
        try {
            const userAns = Answer.create(userAnswer);
            const correctAns = Answer.create(correctAnswer);

            return userAns.matches(correctAns);
        } catch (error) {
            // If answer creation fails (e.g., empty string), it's incorrect
            return false;
        }
    }

    /**
     * Get a similarity score between two answers (0-100)
     * 
     * Current implementation: binary (0 or 100)
     * 
     * TODO(business): Implement actual similarity scoring
     * This could be used for partial credit or hints
     */
    static getSimilarityScore(userAnswer: string, correctAnswer: string): number {
        const isCorrect = this.validate(userAnswer, correctAnswer);
        return isCorrect ? 100 : 0;
    }

    /**
     * Check if an answer is acceptable (not empty, valid format)
     * 
     * TODO(business): Add more sophisticated validation rules
     * For example, minimum length, no special characters only, etc.
     */
    static isAcceptable(answer: string): boolean {
        try {
            Answer.create(answer);
            return true;
        } catch (error) {
            return false;
        }
    }
}
