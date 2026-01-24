/**
 * Import Parsing Logic (Pure Functions)
 * 
 * Strict implementation of Quizlet-like import rules.
 * See: doc/requirement/import-list-question/import-list-question-feature.md
 */

export interface ParsedCard {
    term: string;
    definition: string;
}

export interface ParseRow {
    index: number;
    raw: string;
    card?: ParsedCard;
    valid: boolean;
    error?: string;
}

export interface ParseResult {
    rows: ParseRow[];
    stats: {
        total: number;
        valid: number;
        invalid: number;
    };
}

/**
 * Main parsing function
 * 
 * @param rawText Full text from textarea
 * @param cardSeparator Separator between cards (e.g. \n, ;, ::)
 * @param qaSeparator Separator between term and definition (e.g. \t, ,)
 * @param limit Optional limit for large imports (for preview performance)
 */
export function parseImportText(
    rawText: string,
    cardSeparator: string,
    qaSeparator: string,
    limit?: number
): ParseResult {
    // BR-PARSE-01: Normalize line endings
    const normalizedText = rawText.replace(/\r\n/g, '\n');

    // BR-PARSE-02: Split by card separator
    let blocks = normalizedText.split(cardSeparator);

    // BR-PARSE-03: Discard empty blocks
    blocks = blocks.filter(block => block.trim().length > 0);

    // Apply limit if requested (e.g. for preview performance)
    if (limit && blocks.length > limit) {
        blocks = blocks.slice(0, limit);
    }

    const rows: ParseRow[] = blocks.map((rawBlock, index) => {
        // BR-PARSE-05: Find QA separator (first occurrence)
        const separatorIndex = rawBlock.indexOf(qaSeparator);

        // BR-PARSE-06: Missing separator check
        if (separatorIndex === -1) {
            return {
                index: index + 1,
                raw: rawBlock,
                valid: false,
                error: 'Thiếu ký tự tách Câu hỏi - Trả lời'
            };
        }

        // Split at first occurrence
        const rawTerm = rawBlock.substring(0, separatorIndex);
        const rawDef = rawBlock.substring(separatorIndex + qaSeparator.length);

        // BR-PARSE-07: Trim (preserve internal whitespace)
        const term = rawTerm.trim();
        const definition = rawDef.trim();

        // BR-PARSE-07 (implicit): Empty check
        if (!term) {
            return {
                index: index + 1,
                raw: rawBlock,
                valid: false,
                error: 'Câu hỏi trống'
            };
        }

        if (!definition) {
            return {
                index: index + 1,
                raw: rawBlock,
                valid: false,
                error: 'Trả lời trống'
            };
        }

        // BR-IMP-61: Length validation (>2000 chars)
        if (term.length > 2000) {
            return {
                index: index + 1,
                raw: rawBlock,
                valid: false,
                error: 'Nội dung quá dài (câu hỏi > 2000 ký tự)'
            };
        }

        if (definition.length > 2000) {
            return {
                index: index + 1,
                raw: rawBlock,
                valid: false,
                error: 'Nội dung quá dài (trả lời > 2000 ký tự)'
            };
        }

        return {
            index: index + 1,
            raw: rawBlock,
            card: { term, definition },
            valid: true
        };
    });

    // Calculate stats
    const stats = rows.reduce(
        (acc, row) => {
            acc.total++;
            if (row.valid) acc.valid++;
            else acc.invalid++;
            return acc;
        },
        { total: 0, valid: 0, invalid: 0 }
    );

    return { rows, stats };
}

/**
 * Basic auto-detection for default separators
 * This is a lightweight heuristic, not perfect.
 */
export function detectSeparators(rawText: string): { card: string; qa: string } {
    // Default fallback
    const defaults = { card: '\n', qa: '\t' };

    if (!rawText) return defaults;

    // Detect QA separator: check simpler first
    // If tab is present, it's very likely the intend.
    if (rawText.includes('\t')) {
        return { card: '\n', qa: '\t' };
    }

    // If comma is frequent per line, maybe comma?
    // But simplistic fallback is acceptable as "Auto" generally means defaults
    return defaults;
}
