import { ISetRepository } from '@/domain/repositories/ISetRepository';
import { Card } from '@/domain/entities/Card';
import { SetDTO, CardDTO } from '@/application/dto/SetDTO';
import { Set } from '@/domain/entities/Set';

/**
 * AddCard Use Case
 * 
 * Adds a new card to an existing study set.
 */
export class AddCard {
    constructor(private setRepository: ISetRepository) { }

    /**
     * Execute the use case
     * 
     * @param setId - ID of the set to add the card to
     * @param term - Card term
     * @param definition - Card definition
     * @returns The updated set as a DTO
     * @throws Error if set not found
     */
    async execute(setId: string, term: string, definition: string): Promise<SetDTO> {
        // Find the set
        const set = await this.setRepository.findById(setId);

        if (!set) {
            throw new Error(`Set with ID ${setId} not found`);
        }

        // Create and add the card (domain validates business rules)
        const card = Card.create(term, definition);
        set.addCard(card);

        // Persist the changes
        const savedSet = await this.setRepository.save(set);

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
