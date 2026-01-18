
import { describe, it, expect } from 'vitest';
import { parseImportText, ParseResult } from './importParse';

describe('importParse', () => {
    describe('parseImportText', () => {
        const DEFAULT_CARD_SEP = '\n';
        const DEFAULT_QA_SEP = '\t';

        it('BR-PARSE-01: normalizes line endings', () => {
            const raw = 'Q1\tA1\r\nQ2\tA2';
            const result = parseImportText(raw, DEFAULT_CARD_SEP, DEFAULT_QA_SEP);
            expect(result.rows).toHaveLength(2);
            expect(result.rows[0].card).toEqual({ term: 'Q1', definition: 'A1' });
            expect(result.rows[1].card).toEqual({ term: 'Q2', definition: 'A2' });
        });

        it('BR-PARSE-02 & 03: splits by card separator and discards empty blocks', () => {
            const raw = 'Q1\tA1\n\n   \nQ2\tA2\n';
            const result = parseImportText(raw, DEFAULT_CARD_SEP, DEFAULT_QA_SEP);
            expect(result.rows).toHaveLength(2);
            expect(result.rows[0].raw).toContain('Q1');
            expect(result.rows[1].raw).toContain('Q2');
        });

        it('BR-PARSE-05: splits by QA separator (first occurrence only)', () => {
            const raw = 'Term\tDef Part 1\tDef Part 2';
            const result = parseImportText(raw, DEFAULT_CARD_SEP, DEFAULT_QA_SEP);
            expect(result.rows[0].valid).toBe(true);
            expect(result.rows[0].card?.term).toBe('Term');
            // Should contain the rest of the string including the second tab
            expect(result.rows[0].card?.definition).toBe('Def Part 1\tDef Part 2');
        });

        it('BR-PARSE-06: marks invalid if QA separator missing', () => {
            const raw = 'Just a term no separator';
            const result = parseImportText(raw, DEFAULT_CARD_SEP, DEFAULT_QA_SEP);
            expect(result.rows[0].valid).toBe(false);
            expect(result.rows[0].error).toMatch(/Missing separator/i);
        });

        it('BR-PARSE-07: trims whitespace but preserves internal formatting', () => {
            const raw = '  Term With Spaces  \t  Def  Line 1\nLine 2  ';
            const result = parseImportText(raw, DEFAULT_CARD_SEP, DEFAULT_QA_SEP);
            expect(result.rows[0].card?.term).toBe('Term With Spaces');
            // Note: internal newlines in definition should be preserved if not stripped by card separator logic
            // But here card separator is \n, so a newline inside definition would split the card.
            // Let's test with a different card separator to verify preservation.
            const rawMulti = 'Q1\tA1 Line 1\nA1 Line 2::Q2\tA2';
            const resultMulti = parseImportText(rawMulti, '::', '\t');
            expect(resultMulti.rows[0].card?.definition).toBe('A1 Line 1\nA1 Line 2');
        });

        it('validates empty term', () => {
            const raw = '\tDefinition Only';
            const result = parseImportText(raw, DEFAULT_CARD_SEP, DEFAULT_QA_SEP);
            expect(result.rows[0].valid).toBe(false);
            expect(result.rows[0].error).toMatch(/Term is empty/i);
        });

        it('validates empty definition', () => {
            const raw = 'Term Only\t';
            const result = parseImportText(raw, DEFAULT_CARD_SEP, DEFAULT_QA_SEP);
            expect(result.rows[0].valid).toBe(false);
            expect(result.rows[0].error).toMatch(/Definition is empty/i);
        });

        it('calculates stats correctly', () => {
            const raw = 'Q1\tA1\nInvalid\nQ2\tA2';
            const result = parseImportText(raw, DEFAULT_CARD_SEP, DEFAULT_QA_SEP);
            expect(result.stats).toEqual({
                total: 3,
                valid: 2,
                invalid: 1
            });
        });

        it('handles custom separators', () => {
            const raw = 'Q1,A1;Q2,A2';
            const result = parseImportText(raw, ';', ',');
            expect(result.rows).toHaveLength(2);
            expect(result.rows[0].card).toEqual({ term: 'Q1', definition: 'A1' });
            expect(result.rows[1].card).toEqual({ term: 'Q2', definition: 'A2' });
        });

        it('BR-PARSE-03: discards blocks that are only whitespace (even if containing whitespace separator)', () => {
            const raw = '   \t   ';
            const result = parseImportText(raw, '\n', '\t');
            expect(result.rows).toHaveLength(0);
        });
    });
});
