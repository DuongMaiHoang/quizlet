import { ISetRepository } from '@/domain/repositories/ISetRepository';
import { Set } from '@/domain/entities/Set';
import { SetDTO, CardDTO } from '@/application/dto/SetDTO';

/**
 * CreateSet Use Case
 * 
 * Orchestrates the creation of a new study set.
 * This is the application layer - it coordinates domain logic and persistence.
 */
export class CreateSet {
    constructor(private setRepository: ISetRepository) { }

    /**
     * Execute the use case
     * 
     * @param title - Set title
     * @param description - Set description (optional)
     * @returns The created set as a DTO
     * 
     * TODO(business): Add validation for duplicate titles
     * TODO(business): Consider rate limiting for set creation
     */
    async execute(title: string, description: string = ''): Promise<SetDTO> {
        // Create the domain entity (this validates business rules)
        const set = Set.create(title, description);

        // Persist using the repository
        const savedSet = await this.setRepository.save(set);

        // Convert to DTO for the UI layer
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
