import { ISetRepository } from '@/domain/repositories/ISetRepository';
import { CardId } from '@/domain/value-objects/CardId';
import { SetDTO, CardDTO } from '@/application/dto/SetDTO';
import { Set } from '@/domain/entities/Set';

/**
 * DeleteCard Use Case
 * 
 * Deletes a card from a study set.
 */
export class DeleteCard {
    constructor(private setRepository: ISetRepository) { }

    /**
     * Execute the use case
     * 
     * @param setId - ID of the set containing the card
     * @param cardId - ID of the card to delete
     * @returns The updated set as a DTO
     * @throws Error if set or card not found
     */
    async execute(setId: string, cardId: string): Promise<SetDTO> {
        // Find the set
        const set = await this.setRepository.findById(setId);

        if (!set) {
            throw new Error(`Set with ID ${setId} not found`);
        }

        // Remove the card
        const cardIdObj = CardId.fromString(cardId);
        set.removeCard(cardIdObj);

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
