/**
 * SetId Value Object
 * 
 * Represents a unique identifier for a study set.
 * Using value objects ensures type safety and prevents mixing up IDs.
 */
export class SetId {
    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static create(): SetId {
        // Using timestamp + random for simple unique IDs
        const id = `set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return new SetId(id);
    }

    static fromString(value: string): SetId {
        if (!value || value.trim().length === 0) {
            throw new Error('SetId cannot be empty');
        }
        return new SetId(value);
    }

    toString(): string {
        return this.value;
    }

    equals(other: SetId): boolean {
        return this.value === other.value;
    }
}
