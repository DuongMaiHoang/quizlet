'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, ArrowRight, AlertCircle, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { CreateCardDTO } from '@/application/dto/SetDTO';
import { parseImportText, ParseResult } from '@/ui/lib/importParse';

interface ImportOverlayProps {
    onImport: (cards: CreateCardDTO[]) => void;
    onClose: () => void;
}

type SeparatorType = 'TAB' | 'COMMA' | 'NEWLINE' | 'SEMICOLON' | 'CUSTOM';

const DEBOUNCE_MS = 200;

export function ImportOverlay({ onImport, onClose }: ImportOverlayProps) {
    // Input State
    const [rawText, setRawText] = useState('');

    // Settings State
    const [qaSeparatorType, setQaSeparatorType] = useState<SeparatorType>('TAB');
    const [customQaSeparator, setCustomQaSeparator] = useState(';'); // Default custom

    const [cardSeparatorType, setCardSeparatorType] = useState<SeparatorType>('NEWLINE');
    const [customCardSeparator, setCustomCardSeparator] = useState(';'); // Default custom

    const [skipInvalid, setSkipInvalid] = useState(true);

    // Derived State
    const [parsed, setParsed] = useState<ParseResult>({ rows: [], stats: { total: 0, valid: 0, invalid: 0 } });
    const [isParsing, setIsParsing] = useState(false);

    // Helper to get actual separator strings
    const getQaSeparator = () => {
        switch (qaSeparatorType) {
            case 'TAB': return '\t';
            case 'COMMA': return ',';
            case 'CUSTOM': return customQaSeparator;
            default: return '\t';
        }
    };

    const getCardSeparator = () => {
        switch (cardSeparatorType) {
            case 'NEWLINE': return '\n';
            case 'SEMICOLON': return ';';
            case 'CUSTOM': return customCardSeparator;
            default: return '\n';
        }
    };

    // Debounced Parsing Effect
    useEffect(() => {
        setIsParsing(true);
        const timer = setTimeout(() => {
            const qaSep = getQaSeparator();
            // Don't parse if custom separator is empty
            if (qaSeparatorType === 'CUSTOM' && !customQaSeparator.trim()) {
                setIsParsing(false);
                return;
            }

            const cardSep = getCardSeparator();
            // Don't parse if custom separator is empty
            if (cardSeparatorType === 'CUSTOM' && !customCardSeparator.trim()) {
                setIsParsing(false);
                return;
            }

            const result = parseImportText(rawText, cardSep, qaSep);
            setParsed(result);
            setIsParsing(false);
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [rawText, qaSeparatorType, customQaSeparator, cardSeparatorType, customCardSeparator]);


    const handleImport = () => {
        if (parsed.stats.valid === 0) return;

        // Filter cards based on skipInvalid setting
        const validRows = parsed.rows.filter(r => r.valid && r.card);

        if (!skipInvalid && parsed.stats.invalid > 0) {
            return; // Should be blocked by UI state, but double check
        }

        const cardsToImport: CreateCardDTO[] = validRows.map(r => ({
            term: r.card!.term,
            definition: r.card!.definition
        }));

        if (cardsToImport.length > 200) {
            if (!confirm(`You are about to import ${cardsToImport.length} cards. Continue?`)) {
                return;
            }
        }

        onImport(cardsToImport);
    };

    const handleSwapSeparators = () => {
        // Rudimentary swap logic: try to swap types if they match standard ones
        // If TAB <-> NEWLINE usually doesn't make sense for block/qa swap but 
        // prompt says "Swap QA separator and Card separator".
        // It's useful if user pasted "Term\nDef\n\nTerm2\nDef2" (QA=Newline, Card=Double Newline)
        // Or "Term;Def\nTerm;Def" vs "Term\tDef;Term\tDef"

        // Let's simplified swap:
        // Set QA -> Card settings
        // Set Card -> QA settings
        // But types might not match options.
        // We will just swap the TYPES if they are compatible, or fallback to custom.
        // Actually, let's keep it simple: Swap the *configurations* logically.

        // This is tricky because options sets differ.
        // Let's implement full Custom swap to be safe if types mismatch.

        const currentQaSep = getQaSeparator();
        const currentCardSep = getCardSeparator();

        // Apply to Custom first
        setCustomQaSeparator(currentCardSep);
        setCustomCardSeparator(currentQaSep);

        setQaSeparatorType('CUSTOM');
        setCardSeparatorType('CUSTOM');
    };

    // Derived UI states
    const canImport = parsed.stats.valid > 0 && (skipInvalid || parsed.stats.invalid === 0);
    const importButtonText = parsed.stats.valid > 0
        ? `Import ${parsed.stats.valid} questions`
        : 'Import questions';

    const hasCustomError =
        (qaSeparatorType === 'CUSTOM' && !customQaSeparator.trim()) ||
        (cardSeparatorType === 'CUSTOM' && !customCardSeparator.trim());

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-card border border-border shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-4 bg-card">
                    <h2 className="text-xl font-bold text-foreground">Import questions & answers</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content Grid */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel: Input & Settings */}
                    <div className="flex w-1/2 flex-col gap-6 border-r border-border p-6 overflow-y-auto">

                        {/* Zone A: Paste Area */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-foreground">
                                Copy and paste your data here (from Word, Excel, etc.)
                            </label>
                            <textarea
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                                placeholder="Word1	Definition1&#10;Word2	Definition2&#10;Word3	Definition3"
                                className="h-64 w-full rounded-lg border border-border bg-background p-4 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none"
                            />
                        </div>

                        {/* Zone B: Separator Settings */}
                        <div className="space-y-6">
                            {/* QA Separator */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-foreground">
                                        Between Term and Definition
                                    </label>
                                    <button
                                        onClick={handleSwapSeparators}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                        title="Swap Term/Definition separator with Card separator"
                                    >
                                        <RefreshCw className="h-3 w-3" /> Swap separators
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="qaSep" // Group name
                                            checked={qaSeparatorType === 'TAB'}
                                            onChange={() => setQaSeparatorType('TAB')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-muted-foreground">Tab</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="qaSep"
                                            checked={qaSeparatorType === 'COMMA'}
                                            onChange={() => setQaSeparatorType('COMMA')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-muted-foreground">Comma</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="qaSep"
                                            checked={qaSeparatorType === 'CUSTOM'}
                                            onChange={() => setQaSeparatorType('CUSTOM')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-muted-foreground">Custom</span>
                                        {qaSeparatorType === 'CUSTOM' && (
                                            <input
                                                type="text"
                                                value={customQaSeparator}
                                                onChange={(e) => setCustomQaSeparator(e.target.value)}
                                                className="w-16 rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground focus:border-primary focus:outline-none"
                                                placeholder="e.g. -"
                                            />
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Card Separator */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-foreground">
                                    Between Cards
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="cardSep" // Group name
                                            checked={cardSeparatorType === 'NEWLINE'}
                                            onChange={() => setCardSeparatorType('NEWLINE')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-muted-foreground">New line</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="cardSep"
                                            checked={cardSeparatorType === 'SEMICOLON'}
                                            onChange={() => setCardSeparatorType('SEMICOLON')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-muted-foreground">Semicolon</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="cardSep"
                                            checked={cardSeparatorType === 'CUSTOM'}
                                            onChange={() => setCardSeparatorType('CUSTOM')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-muted-foreground">Custom</span>
                                        {cardSeparatorType === 'CUSTOM' && (
                                            <input
                                                type="text"
                                                value={customCardSeparator}
                                                onChange={(e) => setCustomCardSeparator(e.target.value)}
                                                className="w-16 rounded border border-border bg-background px-2 py-0.5 text-xs text-foreground focus:border-primary focus:outline-none"
                                                placeholder="e.g. ::"
                                            />
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Import Options */}
                        <div className="mt-auto border-t border-border pt-4">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={skipInvalid}
                                    onChange={(e) => setSkipInvalid(e.target.checked)}
                                    className="rounded border-border bg-background text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-muted-foreground">Skip questions with errors</span>
                            </label>
                        </div>
                    </div>

                    {/* Right Panel: Preview (Zone C) */}
                    <div className="flex w-1/2 flex-col bg-background/50">
                        <div className="flex items-center justify-between border-b border-border p-4 bg-card/50">
                            <h3 className="font-semibold text-foreground">Preview</h3>
                            <div className="flex gap-4 text-xs font-medium">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <span className="h-2 w-2 rounded-full bg-success"></span>
                                    {parsed.stats.valid} Valid
                                </div>
                                <div className={`flex items-center gap-1.5 ${parsed.stats.invalid > 0 ? 'text-error' : 'text-muted-foreground'}`}>
                                    <span className={`h-2 w-2 rounded-full ${parsed.stats.invalid > 0 ? 'bg-error' : 'bg-muted'}`}></span>
                                    {parsed.stats.invalid} Invalid
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {parsed.rows.length === 0 && (
                                <div className="flex h-full flex-col items-center justify-center text-center text-muted">
                                    <p>No data to preview</p>
                                    <p className="text-sm text-muted/60">Paste your text on the left to see parsing results</p>
                                </div>
                            )}

                            {parsed.rows.map((row) => (
                                <div
                                    key={row.index}
                                    className={`flex gap-3 rounded-lg border p-3 text-sm transition-opacity ${row.valid
                                            ? 'border-border bg-card'
                                            : `border-error/30 bg-error/5 ${skipInvalid ? 'opacity-50' : ''}`
                                        }`}
                                >
                                    <div className="w-8 shrink-0 text-xs font-medium text-muted/60 pt-0.5">
                                        {row.index}
                                    </div>

                                    {row.valid && row.card ? (
                                        <div className="flex flex-1 gap-4">
                                            <div className="flex-1">
                                                <div className="mb-1 text-[10px] uppercase text-muted/50 font-bold">Term</div>
                                                <div className="text-foreground">{row.card.term}</div>
                                            </div>
                                            <div className="flex-1 border-l border-border pl-4">
                                                <div className="mb-1 text-[10px] uppercase text-muted/50 font-bold">Definition</div>
                                                <div className="text-foreground">{row.card.definition}</div>
                                            </div>
                                            <div className="shrink-0 pt-0.5">
                                                <CheckCircle2 className="h-4 w-4 text-success" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-1 items-start gap-3">
                                            <AlertTriangle className="h-4 w-4 shrink-0 text-error mt-0.5" />
                                            <div className="flex-1">
                                                <div className="font-medium text-error mb-1">
                                                    {row.error || 'Invalid row'}
                                                </div>
                                                <div className="font-mono text-xs text-muted/80 break-all bg-black/20 p-1.5 rounded">
                                                    {row.raw.substring(0, 100)}
                                                    {row.raw.length > 100 && '...'}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between border-t border-border p-4 bg-card">
                    <div className="text-sm">
                        {hasCustomError ? (
                            <span className="text-error flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Custom separator cannot be empty
                            </span>
                        ) : !skipInvalid && parsed.stats.invalid > 0 ? (
                            <span className="text-error flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Fix invalid rows or enable skip invalid
                            </span>
                        ) : null}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!canImport || hasCustomError}
                            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {importButtonText}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
