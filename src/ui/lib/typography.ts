/**
 * Typography utilities for KaiTi Chinese font support v1
 * 
 * Detects Han (Chinese) characters and applies appropriate font styling.
 */

/**
 * Checks if a string contains at least one Han (Chinese) character.
 * Uses CJK Unified Ideographs basic block: \u4E00-\u9FFF
 * 
 * @param text - The text to check (can be null/undefined/empty)
 * @returns true if text contains Han characters, false otherwise
 */
export function containsHan(text: string | null | undefined): boolean {
    if (!text || typeof text !== 'string') {
        return false;
    }
    return /[\u4E00-\u9FFF]/.test(text);
}

/**
 * Returns the CSS class name to apply for KaiTi font if text contains Han characters.
 * 
 * @param text - The text to check
 * @returns "font-kaiti" if text contains Han, empty string otherwise
 */
export function getKaitiClass(text: string | null | undefined): string {
    return containsHan(text) ? 'font-kaiti' : '';
}



