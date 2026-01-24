import type { CardDTO } from '@/application/dto/SetDTO';

/**
 * Learn Mode - Core types & session builder
 *
 * BR-SES-001..004, BR-MCQ-001..007
 */

export type LearnItemType = 'TERM_TO_DEF';

export interface LearnOption {
    optionId: string;
    label: string;
    value: string;
    isCorrect: boolean;
}

export interface LearnItem {
    itemId: string;
    cardId: string;
    type: LearnItemType;
    prompt: string;
    correctAnswer: string;
    options: LearnOption[];
    createdAtIndex: number;
}

export interface LearnSession {
    setId: string;
    items: LearnItem[];
}

/**
 * Normalize a label for uniqueness comparison
 * BR-MCQ-004
 */
export function normalizeLabel(text: string): string {
    return text
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\r?\n/g, ' ')
        .toLowerCase();
}

/**
 * Simple deterministic shuffle based on a seed
 * Used to make option order stable per item (BR-MCQ-006)
 */
function shuffleWithSeed<T>(items: T[], seed: string): T[] {
    const result = [...items];

    let random = 0;
    for (let i = 0; i < seed.length; i++) {
        random += seed.charCodeAt(i);
    }

    function seededRandom() {
        random = (random * 9301 + 49297) % 233280;
        return random / 233280;
    }

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

/**
 * Build options for a single item from the full card list.
 *
 * BR-MCQ-001: optionCount = min(4, N)
 * BR-MCQ-002: exactly one correct option
 * BR-MCQ-003: distractors from other cards in same set
 * BR-MCQ-004: uniqueness by normalized label
 * BR-MCQ-005: allow fewer options if pool too small
 * BR-MCQ-006: stable members, order randomized once
 * BR-MCQ-007: label may be truncated in UI, value is full text
 */
function buildOptionsForItem(
    setId: string,
    cards: CardDTO[],
    currentIndex: number
): LearnOption[] {
    const totalCards = cards.length;
    const optionCount = Math.min(4, totalCards); // BR-MCQ-001

    const currentCard = cards[currentIndex];
    const correctValue = currentCard.definition?.trim() || '(Không có nội dung)';
    const correctLabel = correctValue;

    const options: LearnOption[] = [];

    // Correct option (BR-MCQ-002)
    options.push({
        optionId: `opt-${currentCard.id}-correct`,
        label: correctLabel,
        value: correctValue,
        isCorrect: true,
    });

    const usedNormalized = new Set<string>();
    usedNormalized.add(normalizeLabel(correctLabel));

    // Collect candidate distractors from other cards in the same set (BR-MCQ-003)
    for (let i = 0; i < cards.length && options.length < optionCount; i++) {
        if (i === currentIndex) continue;

        const candidateCard = cards[i];
        const candidateValue = candidateCard.definition?.trim() || '(Không có nội dung)';
        const candidateLabel = candidateValue;
        const normalized = normalizeLabel(candidateLabel);

        // Enforce uniqueness (BR-MCQ-004)
        if (usedNormalized.has(normalized)) {
            continue;
        }

        usedNormalized.add(normalized);

        options.push({
            optionId: `opt-${currentCard.id}-distractor-${candidateCard.id}`,
            label: candidateLabel,
            value: candidateValue,
            isCorrect: false,
        });
    }

    // If we couldn't reach optionCount due to duplicates or low N, we just return
    // what we have (>=1) (BR-MCQ-005)

    // Randomize display order once with a deterministic seed (BR-MCQ-006)
    const seed = `${setId}-${currentCard.id}-${currentIndex}`;
    return shuffleWithSeed(options, seed);
}

/**
 * Build a Learn Session from the current cards of a set.
 *
 * BR-SES-001: one item per card, type TERM_TO_DEF
 * BR-SES-002: item order follows current card order
 * BR-SES-003: options created once per item
 * BR-SES-004: build errors handled at caller level
 */
export function buildLearnSessionFromCards(setId: string, cards: CardDTO[]): LearnSession {
    if (!cards || cards.length === 0) {
        throw new Error('Cannot build Learn session with no cards');
    }

    const items: LearnItem[] = cards.map((card, index) => {
        const promptRaw = card.term?.trim() || '(Không có thuật ngữ)';
        const correctRaw = card.definition?.trim() || '(Không có nội dung)';

        const options = buildOptionsForItem(setId, cards, index);

        return {
            itemId: `item-${card.id}-${index}`,
            cardId: card.id,
            type: 'TERM_TO_DEF',
            prompt: promptRaw,
            correctAnswer: correctRaw,
            options,
            createdAtIndex: index,
        };
    });

    return {
        setId,
        items,
    };
}


