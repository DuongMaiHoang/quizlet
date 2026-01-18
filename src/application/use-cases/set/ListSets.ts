import { ISetRepository } from '@/domain/repositories/ISetRepository';
import { SetDTO, CardDTO } from '@/application/dto/SetDTO';
import { Set } from '@/domain/entities/Set';

/**
 * ListSets Use Case
 * 
 * Retrieves all study sets, optionally filtered by search query.
 */
export class ListSets {
    constructor(private setRepository: ISetRepository) { }

    /**
     * Execute the use case
     * 
     * @param searchQuery - Optional search query to filter sets
     * @returns Array of sets as DTOs
     * 
     * TODO(business): Add sorting options (by date, title, card count)
     * TODO(business): Add pagination for large collections
     * TODO(business): Add filtering by tags/categories
     */
    async execute(searchQuery?: string): Promise<SetDTO[]> {
        let sets: Set[];

        if (searchQuery && searchQuery.trim().length > 0) {
            sets = await this.setRepository.search(searchQuery);
        } else {
            sets = await this.setRepository.findAll();
        }

        // Sort by most recently updated
        sets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

        return sets.map(set => this.toDTO(set));
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
