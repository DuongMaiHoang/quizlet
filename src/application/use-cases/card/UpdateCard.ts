import { ISetRepository } from '@/domain/repositories/ISetRepository';
import { CardId } from '@/domain/value-objects/CardId';
import { SetDTO, CardDTO } from '@/application/dto/SetDTO';
import { Set } from '@/domain/entities/Set';

/**
 * UpdateCard Use Case
 * 
 * Updates an existing card in a study set.
 */
export class UpdateCard {
    constructor(private setRepository: ISetRepository) { }

    /**
     * Execute the use case
     * 
     * @param setId - ID of the set containing the card
     * @param cardId - ID of the card to update
     * @param term - New term
     * @param definition - New definition
     * @returns The updated set as a DTO
     * @throws Error if set or card not found
     */
    async execute(
        setId: string,
        cardId: string,
        term: string,
        definition: string
    ): Promise<SetDTO> {
        // Find the set
        const set = await this.setRepository.findById(setId);

        if (!set) {
            throw new Error(`Set with ID ${setId} not found`);
        }

        // Update the card (domain validates business rules)
        const cardIdObj = CardId.fromString(cardId);
        set.updateCard(cardIdObj, term, definition);

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
