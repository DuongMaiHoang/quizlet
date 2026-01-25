/**
 * Learn Mode v2 - Settings Persistence
 *
 * BR-LRN-V2-040, BR-LRN-V2-041
 */

const STORAGE_KEY_PREFIX = 'learnSettings:v2:';
const SCHEMA_VERSION = 2;

export interface LearnSettingsV2 {
    schemaVersion: number;
    questionTypes: {
        mcqEnabled: boolean;
        multiSelectEnabled: boolean;
        writtenEnabled: boolean;
    };
    options: {
        shuffleQuestions: boolean;
        soundEffects: boolean;
    };
}

const DEFAULT_SETTINGS: LearnSettingsV2 = {
    schemaVersion: SCHEMA_VERSION,
    questionTypes: {
        mcqEnabled: true,
        multiSelectEnabled: false,
        writtenEnabled: false,
    },
    options: {
        shuffleQuestions: false,
        soundEffects: false,
    },
};

function getStorageKey(setId: string): string {
    return `${STORAGE_KEY_PREFIX}${setId}`;
}

/**
 * Load settings for a set
 * BR-LRN-V2-040: Restore saved settings, fallback to defaults
 */
export function loadLearnSettings(setId: string): LearnSettingsV2 {
    try {
        const key = getStorageKey(setId);
        const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;

        if (!raw) {
            return { ...DEFAULT_SETTINGS };
        }

        const parsed = JSON.parse(raw) as LearnSettingsV2;

        // Validate schema version
        if (!parsed || parsed.schemaVersion !== SCHEMA_VERSION) {
            console.warn('Learn settings schema mismatch, using defaults');
            return { ...DEFAULT_SETTINGS };
        }

        // Validate structure
        if (
            !parsed.questionTypes ||
            typeof parsed.questionTypes.mcqEnabled !== 'boolean' ||
            typeof parsed.questionTypes.multiSelectEnabled !== 'boolean' ||
            typeof parsed.questionTypes.writtenEnabled !== 'boolean' ||
            !parsed.options ||
            typeof parsed.options.shuffleQuestions !== 'boolean' ||
            typeof parsed.options.soundEffects !== 'boolean'
        ) {
            console.warn('Learn settings structure invalid, using defaults');
            return { ...DEFAULT_SETTINGS };
        }

        return parsed;
    } catch (error) {
        console.warn('Failed to load learn settings, using defaults:', error);
        return { ...DEFAULT_SETTINGS };
    }
}

/**
 * Save settings for a set
 * BR-LRN-V2-040: Persist per setId
 */
export function saveLearnSettings(setId: string, settings: LearnSettingsV2): void {
    try {
        const key = getStorageKey(setId);
        const toStore: LearnSettingsV2 = {
            ...settings,
            schemaVersion: SCHEMA_VERSION,
        };
        localStorage.setItem(key, JSON.stringify(toStore));
    } catch (error) {
        console.warn('Failed to save learn settings:', error);
        // Optional: show toast "Đã đặt lại tùy chọn để tránh lỗi."
    }
}

/**
 * Check if a question type is available in the current build
 */
export function isQuestionTypeAvailable(type: 'mcq' | 'multiSelect' | 'written'): boolean {
    switch (type) {
        case 'mcq':
            return true; // Always available (v1 baseline)
        case 'multiSelect':
            return false; // Not implemented yet
        case 'written':
            return false; // Not implemented yet
        default:
            return false;
    }
}

