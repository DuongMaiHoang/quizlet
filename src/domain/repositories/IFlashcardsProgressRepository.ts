import { FlashcardsProgress } from '../entities/FlashcardsProgress';
import { SetId } from '../value-objects/SetId';

/**
 * IFlashcardsProgressRepository Interface
 * 
 * Defines the contract for flashcards progress persistence.
 * This interface lives in the domain layer, but implementations
 * will be in the infrastructure layer.
 */
export interface IFlashcardsProgressRepository {
    /**
     * Find progress for a set
     * 
     * @param setId - The set ID
     * @returns Promise resolving to the progress, or undefined if not found
     */
    findBySetId(setId: SetId): Promise<FlashcardsProgress | undefined>;

    /**
     * Save progress for a set
     * 
     * @param progress - The progress to save
     * @returns Promise resolving to the saved progress
     */
    save(progress: FlashcardsProgress): Promise<FlashcardsProgress>;

    /**
     * Delete progress for a set
     * 
     * @param setId - The set ID
     * @returns Promise resolving to true if deleted, false if not found
     */
    delete(setId: SetId): Promise<boolean>;
}
