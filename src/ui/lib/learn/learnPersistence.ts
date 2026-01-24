import type { CardDTO } from '@/application/dto/SetDTO';
import type { LearnItem, LearnSession } from './learnSessionBuilder';
import { buildLearnSessionFromCards } from './learnSessionBuilder';

/**
 * Learn Mode - Local persistence with versioning
 *
 * BR-PRS-001..003
 */

const STORAGE_KEY_PREFIX = 'quizlet_learn_session_';
const CURRENT_VERSION = 'v1';

export type LearnOutcome = 'correct' | 'incorrect' | 'skipped';

export interface LearnPersistenceState {
    version: string;
    setId: string;
    items: LearnItem[];
    outcomesByItemId: Record<string, LearnOutcome>;
    currentIndex: number;
    createdAt: string;
    updatedAt: string;
}

function getStorageKey(setId: string): string {
    return `${STORAGE_KEY_PREFIX}${setId}`;
}

/**
 * Persist session state locally keyed by setId.
 *
 * BR-PRS-001: Persist after any answered/skipped action
 * BR-PRS-003: Include version string
 */
export function saveLearnSession(
    setId: string,
    items: LearnItem[],
    outcomesByItemId: Record<string, LearnOutcome>,
    currentIndex: number
): void {
    try {
        const now = new Date().toISOString();
        const state: LearnPersistenceState = {
            version: CURRENT_VERSION,
            setId,
            items,
            outcomesByItemId,
            currentIndex,
            createdAt: now,
            updatedAt: now,
        };

        const key = getStorageKey(setId);
        localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
        // Ignore persistence errors to avoid breaking UX
        console.warn('Failed to save learn session:', error);
    }
}

/**
 * Try to restore a Learn session for a set.
 *
 * BR-PRS-002: Resume same items, options, outcomes, index
 * BR-PRS-003: If version mismatch/corrupt, return null to trigger fresh session
 */
export function loadLearnSession(
    setId: string,
    cards: CardDTO[]
): LearnPersistenceState | null {
    try {
        const key = getStorageKey(setId);
        const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;

        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as LearnPersistenceState;

        if (!parsed || parsed.version !== CURRENT_VERSION || parsed.setId !== setId) {
            return null;
        }

        // Basic sanity: items length should match current cards length
        if (!Array.isArray(parsed.items) || parsed.items.length !== cards.length) {
            return null;
        }

        return parsed;
    } catch (error) {
        console.warn('Failed to load learn session, starting fresh:', error);
        return null;
    }
}

/**
 * Build a fresh LearnSession and wrap it into a persistence-ready state.
 */
export function buildInitialLearnState(
    setId: string,
    cards: CardDTO[]
): LearnPersistenceState {
    const session: LearnSession = buildLearnSessionFromCards(setId, cards);
    const now = new Date().toISOString();

    return {
        version: CURRENT_VERSION,
        setId,
        items: session.items,
        outcomesByItemId: {},
        currentIndex: 0,
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * Clear persisted session for a set.
 * Used when restarting (BR-CMP-002, BR-PRS-003).
 */
export function clearLearnSession(setId: string): void {
    try {
        const key = getStorageKey(setId);
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('Failed to clear learn session:', error);
    }
}


