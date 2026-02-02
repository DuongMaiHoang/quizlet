/**
 * Pinyin Input Support v1 - Core Conversion Engine
 * 
 * Utilities for Pinyin mode toggle and conversion.
 * 
 * v1 Requirements:
 * - Token pattern: [a-zA-ZüÜvV:]+[1-5]
 * - v/u:/ü → ü normalization
 * - Tone placement: a > e > ou > last vowel
 * - Tone 5 = no mark (remove tone number)
 * - Convert on Space and Blur
 */

/**
 * Tone mark mappings for vowels
 */
const TONE_MARKS: Record<string, Record<string, string>> = {
    'a': { '1': 'ā', '2': 'á', '3': 'ǎ', '4': 'à' },
    'e': { '1': 'ē', '2': 'é', '3': 'ě', '4': 'è' },
    'i': { '1': 'ī', '2': 'í', '3': 'ǐ', '4': 'ì' },
    'o': { '1': 'ō', '2': 'ó', '3': 'ǒ', '4': 'ò' },
    'u': { '1': 'ū', '2': 'ú', '3': 'ǔ', '4': 'ù' },
    'ü': { '1': 'ǖ', '2': 'ǘ', '3': 'ǚ', '4': 'ǜ' },
};

/**
 * Normalizes ü variants (v, u:, ü) to ü
 */
function normalizeUmlaut(text: string): string {
    // Replace v with ü (case-insensitive)
    text = text.replace(/v/gi, 'ü');
    // Replace u: with ü
    text = text.replace(/u:/gi, 'ü');
    return text;
}

/**
 * Finds the vowel to place the tone mark on according to v1 rules:
 * 1) If contains 'a' → tone on 'a'
 * 2) Else if contains 'e' → tone on 'e'
 * 3) Else if contains 'ou' → tone on 'o'
 * 4) Else tone on last vowel
 */
function findToneVowel(token: string): { vowel: string; index: number } | null {
    const lowerToken = token.toLowerCase();
    
    // Rule 1: 'a' takes priority
    const aIndex = lowerToken.indexOf('a');
    if (aIndex !== -1) {
        return { vowel: token[aIndex], index: aIndex };
    }
    
    // Rule 2: 'e' takes priority
    const eIndex = lowerToken.indexOf('e');
    if (eIndex !== -1) {
        return { vowel: token[eIndex], index: eIndex };
    }
    
    // Rule 3: 'ou' → tone on 'o'
    const ouIndex = lowerToken.indexOf('ou');
    if (ouIndex !== -1) {
        return { vowel: token[ouIndex], index: ouIndex };
    }
    
    // Rule 4: Last vowel
    const vowels = /[aeiouü]/gi;
    let lastMatch: RegExpMatchArray | null = null;
    let match: RegExpMatchArray | null;
    while ((match = vowels.exec(token)) !== null) {
        lastMatch = match;
    }
    
    if (lastMatch) {
        return { vowel: lastMatch[0], index: lastMatch.index! };
    }
    
    return null;
}

/**
 * Converts a single Pinyin token (e.g., "ni3" → "nǐ", "ma5" → "ma")
 */
function convertToken(token: string): string {
    // Normalize ü variants
    const normalized = normalizeUmlaut(token);
    
    // Match pattern: [letters]+[1-5]
    const match = normalized.match(/^([a-zA-ZüÜ]+)([1-5])$/);
    if (!match) {
        return token; // Invalid token, return unchanged
    }
    
    const [, letters, tone] = match;
    
    // Tone 5: remove tone number (no mark)
    if (tone === '5') {
        return letters;
    }
    
    // Find which vowel to place tone on
    const toneVowel = findToneVowel(letters);
    if (!toneVowel) {
        return token; // No vowel found, return unchanged
    }
    
    const { vowel, index } = toneVowel;
    const vowelLower = vowel.toLowerCase();
    
    // Get tone mark (tone marks are always lowercase diacritics)
    const toneMarks = TONE_MARKS[vowelLower];
    if (!toneMarks || !toneMarks[tone]) {
        return token; // Invalid tone/vowel combination
    }
    
    const toneMark = toneMarks[tone];
    
    // Replace vowel with tone-marked vowel
    // Tone marks are always lowercase, but we preserve case of surrounding letters
    const before = letters.substring(0, index);
    const after = letters.substring(index + 1);
    return before + toneMark + after;
}

/**
 * Converts Pinyin with tone numbers to Pinyin with tone marks.
 * Example: "ni3 hao3" -> "nǐ hǎo", "ma5" -> "ma"
 * 
 * Token pattern: [a-zA-ZüÜvV:]+[1-5]
 * 
 * @param text - Input text containing Pinyin with tone numbers
 * @returns Converted text with tone marks
 */
export function convertPinyinToTones(text: string): string {
    if (!text) return text;
    
    // Pattern: match tokens [letters]+[1-5]
    // Match tokens that are:
    // - At word boundaries (for normal tokens like "ni3")
    // - Include colon (for "nu:3")
    // Preserve all whitespace and punctuation
    // Use a simpler pattern that matches tokens followed by space, end, or punctuation
    const tokenPattern = /\b([a-zA-ZüÜvV]+[1-5])\b|([a-zA-ZüÜvV:]+[1-5])(?=\s|$|[^\w:])/g;
    
    return text.replace(tokenPattern, (match, wordBoundaryToken, colonToken) => {
        const token = wordBoundaryToken || colonToken;
        if (!token) return match;
        const converted = convertToken(token);
        return converted;
    });
}

/**
 * Checks if text contains Pinyin tone numbers (pattern: [letters]+[1-5])
 */
export function containsPinyinTones(text: string): boolean {
    if (!text) return false;
    // Check for pattern: letters followed by 1-5
    return /\b[a-zA-ZüÜvV:]+[1-5]\b/.test(text);
}
