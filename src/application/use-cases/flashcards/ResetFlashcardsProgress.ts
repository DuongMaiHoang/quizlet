import { IFlashcardsProgressRepository } from '@/domain/repositories/IFlashcardsProgressRepository';
import { FlashcardsProgress } from '@/domain/entities/FlashcardsProgress';
import { SetId } from '@/domain/value-objects/SetId';

/**
 * ResetFlashcardsProgress Use Case
 * 
 * Resets progress for a set (clears knownMap, resets order/index/side).
 * 
 * BR-RESET-02: Clear progress and reset state
 */
export class ResetFlashcardsProgress {
    constructor(private progressRepository: IFlashcardsProgressRepository) { }

    /**
     * Execute the use case
     * 
     * @param setId - Set ID string
     * @returns The reset progress
     */
    async execute(setId: string): Promise<FlashcardsProgress> {
        const setIdVO = SetId.fromString(setId);
        
        const existing = await this.progressRepository.findBySetId(setIdVO);
        
        if (existing) {
            existing.reset();
            return await this.progressRepository.save(existing);
        }

        // If no progress exists, create new one
        const newProgress = FlashcardsProgress.create(setIdVO);
        return await this.progressRepository.save(newProgress);
    }
}
