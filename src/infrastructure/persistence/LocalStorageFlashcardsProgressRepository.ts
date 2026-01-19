import { IFlashcardsProgressRepository } from '@/domain/repositories/IFlashcardsProgressRepository';
import { FlashcardsProgress } from '@/domain/entities/FlashcardsProgress';
import { SetId } from '@/domain/value-objects/SetId';

/**
 * LocalStorageFlashcardsProgressRepository
 * 
 * Implementation of IFlashcardsProgressRepository using browser localStorage.
 * Stores progress per setId with corruption-safe parsing.
 * 
 * BR-PERSIST-01, BR-PERSIST-02, BR-PERSIST-03
 */

const STORAGE_KEY_PREFIX = 'quizlet_flashcards_progress_';

interface StoredProgress {
    setId: string;
    order: 'original' | 'shuffled';
    shuffledOrder?: string[];
    shuffledSeed?: string;
    index: number;
    side: 'term' | 'definition';
    knownMap: Record<string, 'know' | 'learning' | 'unset'>;
    lastUpdatedAt: string;
}

export class LocalStorageFlashcardsProgressRepository implements IFlashcardsProgressRepository {
    /**
     * Get storage key for a set
     */
    private getStorageKey(setId: SetId): string {
        return `${STORAGE_KEY_PREFIX}${setId.toString()}`;
    }

    /**
     * Find progress for a set
     */
    async findBySetId(setId: SetId): Promise<FlashcardsProgress | undefined> {
        try {
            const key = this.getStorageKey(setId);
            const data = localStorage.getItem(key);

            if (!data) {
                return undefined;
            }

            const stored: StoredProgress = JSON.parse(data);
            return FlashcardsProgress.fromPersistence(stored);
        } catch (error) {
            // BR-PERSIST-03: Corruption - return undefined to trigger fresh start
            console.warn('Error parsing flashcards progress, treating as missing:', error);
            return undefined;
        }
    }

    /**
     * Save progress for a set
     */
    async save(progress: FlashcardsProgress): Promise<FlashcardsProgress> {
        try {
            const key = this.getStorageKey(progress.setId);
            const stored = progress.toPersistence();
            localStorage.setItem(key, JSON.stringify(stored));
            return progress;
        } catch (error) {
            // Handle quota exceeded error
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded. Please clear some data.');
            }
            throw error;
        }
    }

    /**
     * Delete progress for a set
     */
    async delete(setId: SetId): Promise<boolean> {
        try {
            const key = this.getStorageKey(setId);
            const exists = localStorage.getItem(key) !== null;
            
            if (exists) {
                localStorage.removeItem(key);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error deleting flashcards progress:', error);
            return false;
        }
    }
}
