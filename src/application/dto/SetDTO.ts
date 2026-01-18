/**
 * Data Transfer Objects (DTOs)
 * 
 * DTOs are used to transfer data between layers.
 * They are simple, serializable objects without business logic.
 */

export interface CardDTO {
    id: string;
    term: string;
    definition: string;
    position: number;
    createdAt: string;
    updatedAt: string;
}

export interface SetDTO {
    id: string;
    title: string;
    description: string;
    cards: CardDTO[];
    cardCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSetDTO {
    title: string;
    description?: string;
}

export interface UpdateSetDTO {
    id: string;
    title: string;
    description: string;
}

export interface CreateCardDTO {
    term: string;
    definition: string;
}

export interface UpdateCardDTO {
    id: string;
    term: string;
    definition: string;
}
