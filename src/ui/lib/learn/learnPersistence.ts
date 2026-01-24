import type { CardDTO } from '@/application/dto/SetDTO';
import type { LearnItem, LearnSession } from './learnSessionBuilder';
import { buildLearnSessionFromCards } from './learnSessionBuilder';

/**
 * Learn Mode - Local persistence with versioning
 *
 * BR-PRS-001..003
 * BR-ADP-030..031, BR-ADP-040
 */

const STORAGE_KEY_PREFIX = 'quizlet_learn_session_';
// Bump version when schema changes so we can safely reset incompatible data.
const CURRENT_VERSION = 'v2';

export type LearnStatus = 'unseen' | 'correct' | 'incorrect' | 'skipped';

export interface LearnPersistenceState {
    version: string;
    setId: string;
    items: LearnItem[];
    statusByItemId: Record<string, LearnStatus>;
    currentIndex: number;
    attempt: number;
    poolItemIds: string[];
    maxProgressPercent: number;
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
 * BR-PRS-003 / BR-ADP-040: Include version string for safe invalidation
 */
export function saveLearnSession(state: LearnPersistenceState): void {
    try {
        const now = new Date().toISOString();
        const toStore: LearnPersistenceState = {
            ...state,
            version: CURRENT_VERSION,
            updatedAt: now,
        };

        const key = getStorageKey(state.setId);
        localStorage.setItem(key, JSON.stringify(toStore));
    } catch (error) {
        // Ignore persistence errors to avoid breaking UX
        console.warn('Failed to save learn session:', error);
    }
}

/**
 * Try to restore a Learn session for a set.
 *
 * BR-PRS-002: Resume same items, options, statuses, index
 * BR-PRS-003 / BR-ADP-040: If version mismatch/corrupt, return null to trigger fresh session
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

        // poolItemIds must be a subset of itemIds
        const itemIds = new Set(parsed.items.map((i) => i.itemId));
        if (
            !Array.isArray(parsed.poolItemIds) ||
            parsed.poolItemIds.length === 0 ||
            parsed.poolItemIds.some((id) => !itemIds.has(id))
        ) {
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
 *
 * Used for attempt=1 main pool.
 */
export function buildInitialLearnState(
    setId: string,
    cards: CardDTO[]
): LearnPersistenceState {
    const session: LearnSession = buildLearnSessionFromCards(setId, cards);
    const now = new Date().toISOString();
    const poolItemIds = session.items.map((item) => item.itemId);

    return {
        version: CURRENT_VERSION,
        setId,
        items: session.items,
        statusByItemId: {},
        currentIndex: 0,
        attempt: 1,
        poolItemIds,
        maxProgressPercent: 0,
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * Clear persisted session for a set.
 * Used when restarting from scratch (BR-ADP-031).
 */
export function clearLearnSession(setId: string): void {
    try {
        const key = getStorageKey(setId);
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('Failed to clear learn session:', error);
    }
}

