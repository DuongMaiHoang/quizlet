import { ISetRepository } from '@/domain/repositories/ISetRepository';
import { TestGenerator, QuestionType } from '@/domain/services/TestGenerator';
import { TestQuestionDTO } from '@/application/dto/StudyDTO';

/**
 * GenerateTest Use Case
 * 
 * Generates a test from a study set.
 */
export class GenerateTest {
    constructor(private setRepository: ISetRepository) { }

    /**
     * Execute the use case
     * 
     * @param setId - ID of the set to generate test from
     * @param questionCount - Number of questions (optional, defaults to all cards)
     * @param multipleChoiceRatio - Ratio of MC questions (0-1, default 0.5)
     * @returns Array of test questions as DTOs
     * @throws Error if set not found or has no cards
     * 
     * TODO(business): Save test configuration for retaking
     * TODO(business): Support custom question selection (e.g., only incorrect cards)
     */
    async execute(
        setId: string,
        questionCount?: number,
        multipleChoiceRatio: number = 0.5
    ): Promise<TestQuestionDTO[]> {
        // Find the set
        const set = await this.setRepository.findById(setId);

        if (!set) {
            throw new Error(`Set with ID ${setId} not found`);
        }

        if (!set.canStudy()) {
            throw new Error('Set must have at least one card to generate a test');
        }

        // Generate test using domain service
        const questions = TestGenerator.generate(set, questionCount, multipleChoiceRatio);

        // Convert to DTOs
        return questions.map(q => ({
            cardId: q.cardId,
            type: q.type === QuestionType.MULTIPLE_CHOICE ? 'MULTIPLE_CHOICE' : 'WRITTEN',
            question: q.question,
            correctAnswer: q.correctAnswer,
            choices: q.choices,
            position: q.position,
        }));
    }
}
