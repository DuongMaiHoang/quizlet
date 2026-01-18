import { ISetRepository } from '@/domain/repositories/ISetRepository';
import { SetDTO, CardDTO } from '@/application/dto/SetDTO';
import { Set } from '@/domain/entities/Set';

/**
 * GetSet Use Case
 * 
 * Retrieves a single study set by ID.
 */
export class GetSet {
    constructor(private setRepository: ISetRepository) { }

    /**
     * Execute the use case
     * 
     * @param id - Set ID
     * @returns The set as a DTO, or undefined if not found
     */
    async execute(id: string): Promise<SetDTO | undefined> {
        const set = await this.setRepository.findById(id);

        if (!set) {
            return undefined;
        }

        return this.toDTO(set);
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
