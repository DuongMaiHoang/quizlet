import { IFlashcardsProgressRepository } from '@/domain/repositories/IFlashcardsProgressRepository';
import { FlashcardsProgress } from '@/domain/entities/FlashcardsProgress';
import { SetId } from '@/domain/value-objects/SetId';

/**
 * LoadFlashcardsProgress Use Case
 * 
 * Loads flashcards progress for a set, or creates new progress if none exists.
 * 
 * BR-PERSIST-02: Restore progress on page load
 * BR-PERSIST-03: Handle corruption safely
 */
export class LoadFlashcardsProgress {
    constructor(private progressRepository: IFlashcardsProgressRepository) { }

    /**
     * Execute the use case
     * 
     * @param setId - Set ID string
     * @returns The progress, or new progress if not found
     */
    async execute(setId: string): Promise<FlashcardsProgress> {
        const setIdVO = SetId.fromString(setId);

        try {
            const existing = await this.progressRepository.findBySetId(setIdVO);
            
            if (existing) {
                return existing;
            }

            // Create new progress if none exists
            const newProgress = FlashcardsProgress.create(setIdVO);
            await this.progressRepository.save(newProgress);
            return newProgress;
        } catch (error) {
            // BR-PERSIST-03: Handle corruption - start fresh
            console.warn('Error loading flashcards progress, starting fresh:', error);
            const newProgress = FlashcardsProgress.create(setIdVO);
            await this.progressRepository.save(newProgress);
            return newProgress;
        }
    }
}
