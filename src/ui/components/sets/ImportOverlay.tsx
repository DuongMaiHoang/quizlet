'use client';

import { useState, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { X, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { CreateCardDTO } from '@/application/dto/SetDTO';
import { parseImportText, ParseResult } from '@/ui/lib/importParse';

interface ImportOverlayProps {
    onImport: (cards: CreateCardDTO[]) => void;
    onClose: () => void;
    setId?: string; // For draft autosave keying
}

type ParseMode = 'tab' | 'doublecolon' | 'custom';

const DEBOUNCE_MS = 300;
const AUTOSAVE_DELAY_MS = 1000;

export function ImportOverlay({ onImport, onClose, setId }: ImportOverlayProps) {
    // Input State
    const [rawText, setRawText] = useState('');

    // Settings State
    const [parseMode, setParseMode] = useState<ParseMode>('tab');
    const [customQaSeparator, setCustomQaSeparator] = useState('');
    const [customCardSeparator, setCustomCardSeparator] = useState('\\n');

    // Derived State
    const [parsed, setParsed] = useState<ParseResult>({ rows: [], stats: { total: 0, valid: 0, invalid: 0 } });
    const [isParsing, setIsParsing] = useState(false);
    const [showDraftBanner, setShowDraftBanner] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Load draft on mount
    useEffect(() => {
        if (setId) {
            const draftKey = `import-draft-${setId}`;
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                try {
                    const draft = JSON.parse(savedDraft);
                    setRawText(draft.text || '');
                    setParseMode(draft.mode || 'tab');
                    setCustomQaSeparator(draft.customQa || '');
                    setCustomCardSeparator(draft.customCard || '\\n');
                    setShowDraftBanner(true);
                    setTimeout(() => setShowDraftBanner(false), 5000);
                } catch (e) {
                    // Invalid draft, ignore
                }
            }
        }
    }, [setId]);

    // Autosave draft
    useEffect(() => {
        if (!setId || !rawText) return;

        const timer = setTimeout(() => {
            const draftKey = `import-draft-${setId}`;
            const draft = {
                text: rawText,
                mode: parseMode,
                customQa: customQaSeparator,
                customCard: customCardSeparator,
                timestamp: Date.now()
            };
            localStorage.setItem(draftKey, JSON.stringify(draft));
        }, AUTOSAVE_DELAY_MS);

        return () => clearTimeout(timer);
    }, [rawText, parseMode, customQaSeparator, customCardSeparator, setId]);

    // Helper to get actual separator strings
    const getQaSeparator = () => {
        switch (parseMode) {
            case 'tab': return '\t';
            case 'doublecolon': return '::';
            case 'custom': return customQaSeparator;
            default: return '\t';
        }
    };

    const getCardSeparator = () => {
        if (parseMode === 'custom') {
            // Support \n as literal newline
            return customCardSeparator.replace(/\\n/g, '\n');
        }
        // For tab and :: modes, always use newline
        return '\n';
    };

    // Debounced Parsing Effect
    useEffect(() => {
        setIsParsing(true);
        const timer = setTimeout(() => {
            const qaSep = getQaSeparator();
            // Don't parse if custom separator is empty
            if (parseMode === 'custom' && !customQaSeparator.trim()) {
                setParsed({ rows: [], stats: { total: 0, valid: 0, invalid: 0 } });
                setIsParsing(false);
                return;
            }

            const cardSep = getCardSeparator();

            try {
                const result = parseImportText(rawText, cardSep, qaSep);
                setParsed(result);
            } catch (e) {
                // Parsing error
                setParsed({ rows: [], stats: { total: 0, valid: 0, invalid: 0 } });
            }
            setIsParsing(false);
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [rawText, parseMode, customQaSeparator, customCardSeparator]);


    const handleImportClick = () => {
        if (parsed.stats.valid === 0) return;

        // BR-IMP-60: Warning for large imports
        if (parsed.stats.valid > 500) {
            if (!confirm(`Bạn đang nhập rất nhiều thẻ (${parsed.stats.valid}). Có thể mất vài giây.`)) {
                return;
            }
        }

        setShowConfirmModal(true);
    };

    const handleConfirmImport = () => {
        const validRows = parsed.rows.filter(r => r.valid && r.card);
        const cardsToImport: CreateCardDTO[] = validRows.map(r => ({
            term: r.card!.term,
            definition: r.card!.definition
        }));

        onImport(cardsToImport);
        setShowConfirmModal(false);

        // Clear draft after successful import
        if (setId) {
            const draftKey = `import-draft-${setId}`;
            localStorage.removeItem(draftKey);
        }
    };

    // Derived UI states
    const canImport = parsed.stats.valid > 0;
    const hasCustomError = parseMode === 'custom' && !customQaSeparator.trim();

    const handleTextareaKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
        const { key, shiftKey } = e;

        // Xử lý Tab trong textarea: chèn ký tự tab, không cho trình duyệt chuyển focus
        if (key === 'Tab' && !shiftKey) {
            e.preventDefault();

            const textarea = e.currentTarget;
            const start = textarea.selectionStart ?? 0;
            const end = textarea.selectionEnd ?? start;

            const before = rawText.slice(0, start);
            const after = rawText.slice(end);
            const nextValue = `${before}\t${after}`;

            setRawText(nextValue);

            const nextPos = start + 1;
            requestAnimationFrame(() => {
                try {
                    textarea.selectionStart = textarea.selectionEnd = nextPos;
                } catch {
                    // ignore selection errors
                }
            });
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-card border border-border shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border p-4 bg-card">
                        <h2 className="text-xl font-bold text-foreground">Nhập nhanh hàng loạt</h2>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            aria-label="Close import overlay"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Draft restored banner */}
                    {showDraftBanner && (
                        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-sm text-primary flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Đã khôi phục bản nháp
                        </div>
                    )}

                    {/* Content Grid */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Left Panel: Input & Settings */}
                        <div className="flex w-1/2 flex-col gap-6 border-r border-border p-6 overflow-y-auto">

                            {/* Zone A: Paste Area */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="import-textarea" className="text-sm font-medium text-foreground">
                                    Dán nội dung
                                </label>
                                <textarea
                                    id="import-textarea"
                                    value={rawText}
                                    onChange={(e) => setRawText(e.target.value)}
                                    onKeyDown={handleTextareaKeyDown}
                                    placeholder={"Ví dụ:\nTừ 1\tNghĩa 1\nTừ 2\tNghĩa 2\n\nHoặc:\nCâu hỏi 1 :: Trả lời 1\nCâu hỏi 2 :: Trả lời 2"}
                                    className="h-64 w-full rounded-lg border border-border bg-background p-4 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none"
                                    aria-label="Paste content for bulk import"
                                />
                            </div>

                            {/* Zone B: Mode Selector */}
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-foreground">
                                    Chọn kiểu tách
                                </label>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="parseMode"
                                            checked={parseMode === 'tab'}
                                            onChange={() => setParseMode('tab')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-foreground">Mặc định: Tab (khuyên dùng)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="parseMode"
                                            checked={parseMode === 'doublecolon'}
                                            onChange={() => setParseMode('doublecolon')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-foreground">Mặc định: Dấu ::</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="parseMode"
                                            checked={parseMode === 'custom'}
                                            onChange={() => setParseMode('custom')}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm text-foreground">Tùy chỉnh</span>
                                    </label>
                                </div>

                                {/* Custom mode fields */}
                                {parseMode === 'custom' && (
                                    <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                                        <div>
                                            <label className="block text-xs font-medium text-muted mb-1">
                                                Ký tự tách Câu hỏi - Trả lời
                                            </label>
                                            <input
                                                type="text"
                                                id="custom-qa-separator"
                                                value={customQaSeparator}
                                                onChange={(e) => setCustomQaSeparator(e.target.value)}
                                                placeholder="Ví dụ: ::"
                                                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                                                aria-label="Custom question-answer separator"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted mb-1">
                                                Ký tự tách giữa các thẻ
                                            </label>
                                            <input
                                                type="text"
                                                id="custom-card-separator"
                                                value={customCardSeparator}
                                                onChange={(e) => setCustomCardSeparator(e.target.value)}
                                                placeholder="Ví dụ: \n (xuống dòng)"
                                                className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                                                aria-label="Custom card separator"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Preview (Zone C) */}
                        <div className="flex w-1/2 flex-col bg-background/50">
                            <div className="flex items-center justify-between border-b border-border p-4 bg-card/50">
                                <h3 className="font-semibold text-foreground">Xem trước</h3>
                                <div className="flex gap-4 text-xs font-medium">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <span className="h-2 w-2 rounded-full bg-success"></span>
                                        {parsed.stats.valid} Hợp lệ
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${parsed.stats.invalid > 0 ? 'text-error' : 'text-muted-foreground'}`}>
                                        <span className={`h-2 w-2 rounded-full ${parsed.stats.invalid > 0 ? 'bg-error' : 'bg-muted'}`}></span>
                                        {parsed.stats.invalid} Lỗi
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {parsed.rows.length === 0 && (
                                    <div className="flex h-full flex-col items-center justify-center text-center text-muted">
                                        <p>{hasCustomError ? 'Vui lòng nhập ký tự tách' : 'Chưa nhận diện được thẻ nào. Hãy kiểm tra định dạng.'}</p>
                                    </div>
                                )}

                                {parsed.rows.map((row) => (
                                    <div
                                        key={row.index}
                                        className={`flex gap-3 rounded-lg border p-3 text-sm ${row.valid
                                                ? 'border-border bg-card'
                                                : 'border-error/30 bg-error/5'
                                            }`}
                                    >
                                        <div className="w-8 shrink-0 text-xs font-medium text-muted/60 pt-0.5">
                                            {row.index}
                                        </div>

                                        {row.valid && row.card ? (
                                            <div className="flex flex-1 gap-4">
                                                <div className="flex-1">
                                                    <div className="mb-1 text-[10px] uppercase text-muted/50 font-bold">Câu hỏi</div>
                                                    <div className="text-foreground whitespace-pre-wrap">{row.card.term}</div>
                                                </div>
                                                <div className="flex-1 border-l border-border pl-4">
                                                    <div className="mb-1 text-[10px] uppercase text-muted/50 font-bold">Trả lời</div>
                                                    <div className="text-foreground whitespace-pre-wrap">{row.card.definition}</div>
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
                                                        {row.error || 'Thiếu ký tự tách Câu hỏi - Trả lời'}
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
                                    Vui lòng nhập ký tự tách
                                </span>
                            ) : parsed.stats.valid === 0 && rawText.trim() ? (
                                <span className="text-muted flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Chưa nhận diện được thẻ nào. Hãy kiểm tra định dạng.
                                </span>
                            ) : null}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-white/5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleImportClick}
                                disabled={!canImport || hasCustomError}
                                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {canImport ? `Nhập ${parsed.stats.valid} thẻ` : 'Nhập thẻ'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            Xác nhận nhập thẻ
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {parsed.stats.invalid > 0
                                ? `Hợp lệ: ${parsed.stats.valid}, Lỗi: ${parsed.stats.invalid}`
                                : `Bạn muốn thêm ${parsed.stats.valid} thẻ vào bộ thẻ này?`}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                Nhập
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
