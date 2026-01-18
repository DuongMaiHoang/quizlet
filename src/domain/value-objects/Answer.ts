/**
 * Answer Value Object
 * 
 * Represents a user's answer with validation logic.
 * Encapsulates the business rules for what constitutes a valid answer.
 */
export class Answer {
    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static create(value: string): Answer {
        // Trim and normalize the answer
        const normalized = value.trim();

        if (normalized.length === 0) {
            throw new Error('Answer cannot be empty');
        }

        // TODO(business): Add maximum length validation if needed
        // TODO(business): Consider sanitizing HTML/special characters

        return new Answer(normalized);
    }

    /**
     * Get the normalized answer value (trimmed, lowercase for comparison)
     */
    getNormalized(): string {
        return this.value.toLowerCase().trim();
    }

    /**
     * Get the original answer value
     */
    getValue(): string {
        return this.value;
    }

    /**
     * Check if this answer matches another answer
     * Uses case-insensitive comparison
     * 
     * TODO(business): Implement fuzzy matching for typos
     * TODO(business): Consider partial credit for close answers
     */
    matches(other: Answer): boolean {
        return this.getNormalized() === other.getNormalized();
    }

    /**
     * Check if this answer matches a string
     */
    matchesString(value: string): boolean {
        const otherAnswer = Answer.create(value);
        return this.matches(otherAnswer);
    }
}
