/**
 * Learn Mode v3 - Question Type Engine
 *
 * Implements deterministic round-robin type rotation per spec:
 * - ENG-001: effectiveTypes must be non-empty
 * - ENG-010: item selection follows existing logic (not redefined here)
 * - ENG-020: type rotation - simple round-robin
 * - ENG-021: type order stability within attempt
 * - ENG-030: shuffleQuestions affects items, not type rotation determinism
 */

export type QuestionType = 'MCQ' | 'MULTI_SELECT' | 'WRITTEN';

export interface QuestionTypeEngineInput {
    enabledTypes: QuestionType[];
    availableTypes: QuestionType[];
    currentAttemptPool: string[]; // itemIds for current attempt
    statusByItemId: Record<string, 'unseen' | 'correct' | 'incorrect' | 'skipped'>;
    lastTypeUsed: QuestionType | null;
    attemptNumber: number;
    currentItemIndex: number; // index within currentAttemptPool
}

export interface QuestionTypeEngineOutput {
    nextItemId: string | null; // null if attempt complete
    nextQuestionType: QuestionType;
}

/**
 * Compute effective types (enabled AND available)
 * ENG-001: Must guarantee at least 1 effective type
 */
export function computeEffectiveTypes(
    enabledTypes: QuestionType[],
    availableTypes: QuestionType[]
): QuestionType[] {
    const effective = enabledTypes.filter((type) => availableTypes.includes(type));
    return effective.length > 0 ? effective : [];
}

/**
 * Generate deterministic type rotation order for an attempt
 * ENG-020: Round-robin order
 * ENG-021: Stable within attempt
 */
export function generateTypeRotationOrder(
    effectiveTypes: QuestionType[],
    attemptNumber: number,
    poolItemIds: string[]
): QuestionType[] {
    if (effectiveTypes.length === 0) {
        return [];
    }

    if (effectiveTypes.length === 1) {
        // Single type: return array of that type for all items
        return poolItemIds.map(() => effectiveTypes[0]);
    }

    // Multiple types: round-robin
    const rotation: QuestionType[] = [];
    for (let i = 0; i < poolItemIds.length; i++) {
        rotation.push(effectiveTypes[i % effectiveTypes.length]);
    }

    return rotation;
}

/**
 * Get next question type using round-robin
 * ENG-020: Avoid repeating same type twice in a row unless forced
 */
export function getNextQuestionType(
    effectiveTypes: QuestionType[],
    lastTypeUsed: QuestionType | null,
    itemIndex: number,
    typeRotationOrder: QuestionType[]
): QuestionType {
    if (effectiveTypes.length === 0) {
        throw new Error('ENG-001: effectiveTypes must be non-empty');
    }

    if (effectiveTypes.length === 1) {
        return effectiveTypes[0];
    }

    // Use pre-computed rotation order
    if (itemIndex < typeRotationOrder.length) {
        return typeRotationOrder[itemIndex];
    }

    // Fallback: round-robin based on index
    return effectiveTypes[itemIndex % effectiveTypes.length];
}

/**
 * Main engine function: determine next question
 * Returns null for nextItemId if attempt is complete
 */
export function getNextQuestion(
    input: QuestionTypeEngineInput
): QuestionTypeEngineOutput | null {
    const effectiveTypes = computeEffectiveTypes(input.enabledTypes, input.availableTypes);

    if (effectiveTypes.length === 0) {
        // ENG-001: Cannot proceed without effective types
        throw new Error('ENG-001: No effective question types available');
    }

    // Check if attempt is complete
    if (input.currentItemIndex >= input.currentAttemptPool.length) {
        return null;
    }

    const nextItemId = input.currentAttemptPool[input.currentItemIndex];
    const typeRotationOrder = generateTypeRotationOrder(
        effectiveTypes,
        input.attemptNumber,
        input.currentAttemptPool
    );

    const nextQuestionType = getNextQuestionType(
        effectiveTypes,
        input.lastTypeUsed,
        input.currentItemIndex,
        typeRotationOrder
    );

    return {
        nextItemId,
        nextQuestionType,
    };
}

