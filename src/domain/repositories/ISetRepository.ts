import { Set } from '../entities/Set';

/**
 * ISetRepository Interface
 * 
 * Defines the contract for set persistence.
 * This interface lives in the domain layer, but implementations
 * will be in the infrastructure layer.
 * 
 * This follows the Dependency Inversion Principle - the domain
 * defines what it needs, and infrastructure provides it.
 */
export interface ISetRepository {
    /**
     * Find all sets
     * 
     * @returns Promise resolving to array of all sets
     */
    findAll(): Promise<Set[]>;

    /**
     * Find a set by ID
     * 
     * @param id - The set ID to search for
     * @returns Promise resolving to the set, or undefined if not found
     */
    findById(id: string): Promise<Set | undefined>;

    /**
     * Search sets by title
     * 
     * @param query - Search query string
     * @returns Promise resolving to array of matching sets
     * 
     * TODO(business): Implement fuzzy search or search by description
     * TODO(business): Add pagination for large result sets
     */
    search(query: string): Promise<Set[]>;

    /**
     * Save a set (create or update)
     * 
     * @param set - The set to save
     * @returns Promise resolving to the saved set
     */
    save(set: Set): Promise<Set>;

    /**
     * Delete a set by ID
     * 
     * @param id - The set ID to delete
     * @returns Promise resolving to true if deleted, false if not found
     */
    delete(id: string): Promise<boolean>;

    /**
     * Get the total count of sets
     * 
     * @returns Promise resolving to the count
     */
    count(): Promise<number>;
}
