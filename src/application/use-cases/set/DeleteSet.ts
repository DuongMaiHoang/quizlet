import { ISetRepository } from '@/domain/repositories/ISetRepository';

/**
 * DeleteSet Use Case
 * 
 * Deletes a study set.
 */
export class DeleteSet {
    constructor(private setRepository: ISetRepository) { }

    /**
     * Execute the use case
     * 
     * @param id - Set ID to delete
     * @returns true if deleted, false if not found
     * 
     * TODO(business): Add soft delete instead of hard delete
     * TODO(business): Consider archiving instead of deleting
     * TODO(business): Add confirmation/undo mechanism
     */
    async execute(id: string): Promise<boolean> {
        return await this.setRepository.delete(id);
    }
}
