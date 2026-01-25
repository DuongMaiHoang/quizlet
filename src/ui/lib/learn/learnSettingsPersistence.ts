/**
 * Learn Mode v2 - Settings Persistence
 *
 * BR-LRN-V2-040, BR-LRN-V2-041
 */

const STORAGE_KEY_PREFIX = 'learnSettings:v2:';
const CURRENT_SCHEMA_VERSION = 2;

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
    schemaVersion: CURRENT_SCHEMA_VERSION,
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
 * BR-LRN-V2-040: Restore saved settings on Learn entry
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
        if (!parsed || parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
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
 * BR-LRN-V2-010: Persist on Apply
 */
export function saveLearnSettings(setId: string, settings: LearnSettingsV2): void {
    try {
        const key = getStorageKey(setId);
        const toStore: LearnSettingsV2 = {
            ...settings,
            schemaVersion: CURRENT_SCHEMA_VERSION,
        };
        localStorage.setItem(key, JSON.stringify(toStore));
    } catch (error) {
        console.warn('Failed to save learn settings:', error);
        // Optional: show toast "Đã đặt lại tùy chọn để tránh lỗi."
    }
}

/**
 * Get default settings
 */
export function getDefaultLearnSettings(): LearnSettingsV2 {
    return { ...DEFAULT_SETTINGS };
}

