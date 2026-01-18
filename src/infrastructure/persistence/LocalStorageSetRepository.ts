import { ISetRepository } from '@/domain/repositories/ISetRepository';
import { Set } from '@/domain/entities/Set';
import { SetId } from '@/domain/value-objects/SetId';
import { CardId } from '@/domain/value-objects/CardId';
import { CardProps } from '@/domain/entities/Card';

/**
 * LocalStorageSetRepository
 * 
 * Implementation of ISetRepository using browser localStorage.
 * This is swappable - you can replace this with an API-based repository
 * without changing any domain or application code.
 */

const STORAGE_KEY = 'quizlet_sets';

interface StoredSet {
    id: string;
    title: string;
    description: string;
    cards: StoredCard[];
    createdAt: string;
    updatedAt: string;
}

interface StoredCard {
    id: string;
    term: string;
    definition: string;
    position: number;
    createdAt: string;
    updatedAt: string;
}

export class LocalStorageSetRepository implements ISetRepository {
    /**
     * Find all sets
     */
    async findAll(): Promise<Set[]> {
        const stored = this.getAllStored();
        return stored.map(s => this.toDomain(s));
    }

    /**
     * Find a set by ID
     */
    async findById(id: string): Promise<Set | undefined> {
        const stored = this.getAllStored();
        const found = stored.find(s => s.id === id);

        if (!found) {
            return undefined;
        }

        return this.toDomain(found);
    }

    /**
     * Search sets by title
     * 
     * Case-insensitive search
     * 
     * TODO(business): Implement more sophisticated search (fuzzy, by description, by card content)
     */
    async search(query: string): Promise<Set[]> {
        const stored = this.getAllStored();
        const lowerQuery = query.toLowerCase();

        const filtered = stored.filter(s =>
            s.title.toLowerCase().includes(lowerQuery) ||
            s.description.toLowerCase().includes(lowerQuery)
        );

        return filtered.map(s => this.toDomain(s));
    }

    /**
     * Save a set (create or update)
     */
    async save(set: Set): Promise<Set> {
        const stored = this.getAllStored();
        const setId = set.id.toString();

        // Convert to storage format
        const toStore = this.toStorage(set);

        // Find existing index
        const existingIndex = stored.findIndex(s => s.id === setId);

        if (existingIndex >= 0) {
            // Update existing
            stored[existingIndex] = toStore;
        } else {
            // Add new
            stored.push(toStore);
        }

        // Save to localStorage
        this.saveAll(stored);

        return set;
    }

    /**
     * Delete a set by ID
     */
    async delete(id: string): Promise<boolean> {
        const stored = this.getAllStored();
        const initialLength = stored.length;

        const filtered = stored.filter(s => s.id !== id);

        if (filtered.length === initialLength) {
            // Not found
            return false;
        }

        this.saveAll(filtered);
        return true;
    }

    /**
     * Get total count of sets
     */
    async count(): Promise<number> {
        const stored = this.getAllStored();
        return stored.length;
    }

    /**
     * Get all stored sets from localStorage
     */
    private getAllStored(): StoredSet[] {
        try {
            const data = localStorage.getItem(STORAGE_KEY);

            if (!data) {
                return [];
            }

            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    /**
     * Save all sets to localStorage
     */
    private saveAll(sets: StoredSet[]): void {
        try {
            const data = JSON.stringify(sets);
            localStorage.setItem(STORAGE_KEY, data);
        } catch (error) {
            // Handle quota exceeded error
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded. Please delete some sets.');
            }
            throw error;
        }
    }

    /**
     * Convert domain Set to storage format
     */
    private toStorage(set: Set): StoredSet {
        const persistence = set.toPersistence();

        return {
            id: persistence.id.toString(),
            title: persistence.title,
            description: persistence.description,
            cards: persistence.cards.map(c => ({
                id: c.id.toString(),
                term: c.term,
                definition: c.definition,
                position: c.position,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
            })),
            createdAt: persistence.createdAt.toISOString(),
            updatedAt: persistence.updatedAt.toISOString(),
        };
    }

    /**
     * Convert storage format to domain Set
     */
    private toDomain(stored: StoredSet): Set {
        const cards: CardProps[] = stored.cards.map(c => ({
            id: CardId.fromString(c.id),
            term: c.term,
            definition: c.definition,
            position: c.position,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
        }));

        return Set.fromPersistence({
            id: SetId.fromString(stored.id),
            title: stored.title,
            description: stored.description,
            cards,
            createdAt: new Date(stored.createdAt),
            updatedAt: new Date(stored.updatedAt),
        });
    }
}
