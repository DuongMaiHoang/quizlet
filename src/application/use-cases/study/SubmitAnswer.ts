import { AnswerValidator } from '@/domain/services/AnswerValidator';

/**
 * SubmitAnswer Use Case
 * 
 * Validates a user's answer against the correct answer.
 * Used in Learn and Test modes.
 */
export class SubmitAnswer {
    /**
     * Execute the use case
     * 
     * @param userAnswer - The answer provided by the user
     * @param correctAnswer - The expected correct answer
     * @returns Object with validation result and feedback
     * 
     * TODO(business): Add hints for incorrect answers
     * TODO(business): Track answer history for analytics
     * TODO(business): Implement partial credit scoring
     */
    execute(userAnswer: string, correctAnswer: string): {
        isCorrect: boolean;
        userAnswer: string;
        correctAnswer: string;
        feedback?: string;
    } {
        const isCorrect = AnswerValidator.validate(userAnswer, correctAnswer);

        // TODO(business): Generate helpful feedback based on the error
        // For example, "Close! Check your spelling" or "You're on the right track"

        return {
            isCorrect,
            userAnswer,
            correctAnswer,
            feedback: isCorrect
                ? 'Correct!'
                : `Incorrect. The correct answer is: ${correctAnswer}`,
        };
    }
}
