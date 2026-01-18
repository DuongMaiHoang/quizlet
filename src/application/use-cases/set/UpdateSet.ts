import { ISetRepository } from '@/domain/repositories/ISetRepository';
import { SetId } from '@/domain/value-objects/SetId';
import { SetDTO, CardDTO } from '@/application/dto/SetDTO';
import { Set } from '@/domain/entities/Set';

/**
 * UpdateSet Use Case
 * 
 * Updates an existing study set's title and description.
 */
export class UpdateSet {
    constructor(private setRepository: ISetRepository) { }

    /**
     * Execute the use case
     * 
     * @param id - Set ID
     * @param title - New title
     * @param description - New description
     * @returns The updated set as a DTO
     * @throws Error if set not found
     */
    async execute(id: string, title: string, description: string): Promise<SetDTO> {
        // Find the existing set
        const set = await this.setRepository.findById(id);

        if (!set) {
            throw new Error(`Set with ID ${id} not found`);
        }

        // Update the domain entity (this validates business rules)
        set.update(title, description);

        // Persist the changes
        const savedSet = await this.setRepository.save(set);

        // Convert to DTO
        return this.toDTO(savedSet);
    }

    private toDTO(set: Set): SetDTO {
        const cards: CardDTO[] = set.cards.map(card => ({
            id: card.id.toString(),
            term: card.term,
            definition: card.definition,
            position: card.position,
            createdAt: card.createdAt.toISOString(),
            updatedAt: card.updatedAt.toISOString(),
        }));

        return {
            id: set.id.toString(),
            title: set.title,
            description: set.description,
            cards,
            cardCount: set.cardCount,
            createdAt: set.createdAt.toISOString(),
            updatedAt: set.updatedAt.toISOString(),
        };
    }
}
