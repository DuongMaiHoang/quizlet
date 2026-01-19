import { IFlashcardsProgressRepository } from '@/domain/repositories/IFlashcardsProgressRepository';
import { FlashcardsProgress } from '@/domain/entities/FlashcardsProgress';

/**
 * SaveFlashcardsProgress Use Case
 * 
 * Saves flashcards progress immediately.
 * 
 * BR-PERSIST-01: Persist within same tick (no debounce > 250ms)
 */
export class SaveFlashcardsProgress {
    constructor(private progressRepository: IFlashcardsProgressRepository) { }

    /**
     * Execute the use case
     * 
     * @param progress - The progress to save
     * @returns The saved progress
     */
    async execute(progress: FlashcardsProgress): Promise<FlashcardsProgress> {
        return await this.progressRepository.save(progress);
    }
}
