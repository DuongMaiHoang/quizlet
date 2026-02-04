'use client';

import { useState, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { X, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { CreateCardDTO } from '@/application/dto/SetDTO';
import { parseImportText, ParseResult } from '@/ui/lib/importParse';
import { SmartText } from '@/ui/components/common/SmartText';
import { PinyinTextarea } from './PinyinTextarea';

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

    // Prompt generator (for ChatGPT)
    const [promptExtra, setPromptExtra] = useState('');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [copied, setCopied] = useState(false);

    // Popup scale (zoom out to see more content)
    const SCALE_STORAGE_KEY = 'ui:importOverlayScale';
    const DEFAULT_SCALE = 0.85; // effective scale will be smaller due to global html zoom
    const MIN_SCALE = 0.7;
    const MAX_SCALE = 1.0;
    const SCALE_STEP = 0.05;
    const [overlayScale, setOverlayScale] = useState<number>(DEFAULT_SCALE);

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

    // Load popup scale
    useEffect(() => {
        const saved = localStorage.getItem(SCALE_STORAGE_KEY);
        if (!saved) return;
        const parsed = parseFloat(saved);
        if (!Number.isFinite(parsed)) return;
        const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, parsed));
        setOverlayScale(clamped);
    }, []);

    const updateOverlayScale = (next: number) => {
        const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
        setOverlayScale(clamped);
        localStorage.setItem(SCALE_STORAGE_KEY, String(clamped));
    };

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

    const getModeLabel = () => {
        switch (parseMode) {
            case 'tab': return 'Tab';
            case 'doublecolon': return 'Dấu ::';
            case 'custom': return 'Tùy chỉnh';
            default: return 'Tab';
        }
    };

    const escapeForDisplay = (value: string) => {
        // Make separators visible inside a prompt (so users understand exact chars)
        return value
            .replace(/\t/g, '\\t')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
    };

    const buildGptPrompt = () => {
        const qaSep = getQaSeparator();
        const cardSep = getCardSeparator();
        const qaSepShown = escapeForDisplay(qaSep);
        const cardSepShown = escapeForDisplay(cardSep);
        const extra = promptExtra.trim();

        return [
            'Bạn là trợ lý tạo dữ liệu flashcard.',
            '',
            `Mục tiêu: tạo danh sách Câu hỏi/Thuật ngữ và Trả lời/Định nghĩa để mình dán vào Quizlet Clone (popup "Nhập nhanh hàng loạt").`,
            '',
            `KIỂU TÁCH ĐANG CHỌN: ${getModeLabel()}`,
            `- Ký tự tách Câu hỏi - Trả lời (QA separator): ${qaSepShown}`,
            `- Ký tự tách giữa các thẻ (Card separator): ${cardSepShown}`,
            '',
            'YÊU CẦU ĐỊNH DẠNG OUTPUT (BẮT BUỘC):',
            `- Mỗi thẻ là 1 dòng (hoặc 1 "record")`,
            `- Trong mỗi thẻ, nối Câu hỏi và Trả lời bằng đúng QA separator: ${qaSepShown}`,
            `- Giữa các thẻ, dùng đúng Card separator: ${cardSepShown}`,
            '- KHÔNG in tiêu đề, KHÔNG đánh số thứ tự, KHÔNG bullet, KHÔNG markdown code block.',
            '- Chỉ xuất đúng nội dung thẻ theo format, không giải thích.',
            '',
            'QUY TẮC AN TOÀN FORMAT:',
            `- Tuyệt đối không dùng lại chuỗi "${qaSepShown}" bên trong nội dung câu hỏi/trả lời (nếu cần, hãy diễn đạt lại để tránh ký tự tách).`,
            '- Tránh xuống dòng trong nội dung của 1 thẻ (giữ 1 record = 1 thẻ).',
            '',
            'VÍ DỤ OUTPUT (minh hoạ):',
            `Câu hỏi 1${qaSep}Trả lời 1`,
            `${cardSep}Câu hỏi 2${qaSep}Trả lời 2`,
            '',
            'ĐỀ BÀI / YÊU CẦU NỘI DUNG (người dùng sẽ nhập bên dưới):',
            extra ? extra : '(Hãy chờ mình nhập yêu cầu ở đây. Khi có, hãy tạo khoảng 20-50 thẻ theo đúng format ở trên.)',
        ].join('\n');
    };

    const handleGeneratePrompt = () => {
        // Prevent generating nonsense prompt for missing custom QA separator
        if (parseMode === 'custom' && !customQaSeparator.trim()) {
            setGeneratedPrompt('Vui lòng nhập "Ký tự tách Câu hỏi - Trả lời" trước khi generate prompt.');
            return;
        }
        setGeneratedPrompt(buildGptPrompt());
    };

    const handleCopyPrompt = async () => {
        const text = generatedPrompt.trim();
        if (!text) return;

        const setCopiedWithTimeout = () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        };

        try {
            await navigator.clipboard.writeText(text);
            setCopiedWithTimeout();
            return;
        } catch {
            // Fallback for environments where Clipboard API is blocked
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'fixed';
                textarea.style.top = '-9999px';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (ok) {
                    setCopiedWithTimeout();
                }
            } catch {
                // ignore
            }
        }
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
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm"
            >
                <div
                    className="flex h-[100vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl bg-card border border-border shadow-2xl"
                    style={{ zoom: overlayScale }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border p-4 bg-card">
                        <h2 className="text-xl font-bold text-foreground">Nhập nhanh hàng loạt</h2>
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2 py-1">
                                <span className="text-[11px] font-medium text-muted-foreground">Scale</span>
                                <button
                                    onClick={() => updateOverlayScale(overlayScale - SCALE_STEP)}
                                    disabled={overlayScale <= MIN_SCALE + 1e-6}
                                    className="rounded-md px-2 py-1 text-xs font-medium text-foreground hover:bg-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Zoom out popup"
                                    type="button"
                                >
                                    -
                                </button>
                                <span className="min-w-[3.25rem] text-center text-[11px] font-semibold text-foreground tabular-nums">
                                    {Math.round(overlayScale * 100)}%
                                </span>
                                <button
                                    onClick={() => updateOverlayScale(overlayScale + SCALE_STEP)}
                                    disabled={overlayScale >= MAX_SCALE - 1e-6}
                                    className="rounded-md px-2 py-1 text-xs font-medium text-foreground hover:bg-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Zoom in popup"
                                    type="button"
                                >
                                    +
                                </button>
                                <button
                                    onClick={() => updateOverlayScale(DEFAULT_SCALE)}
                                    className="rounded-md px-2 py-1 text-[11px] font-medium text-foreground hover:bg-card-hover"
                                    aria-label="Reset popup scale"
                                    type="button"
                                >
                                    Reset
                                </button>
                            </div>

                            <button
                                onClick={onClose}
                                className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                aria-label="Close import overlay"
                                type="button"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
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
                        {/* Prompt Panel (Small, Left) */}
                        <div className="flex w-[22rem] flex-col gap-4 border-r border-border bg-card/40 p-4 overflow-y-auto">
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-foreground truncate">Prompt cho ChatGPT</div>
                                    <div className="text-xs text-muted-foreground">
                                        Tự bám theo kiểu tách bạn đang chọn
                                    </div>
                                </div>
                                <button
                                    onClick={handleGeneratePrompt}
                                    className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-foreground hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                >
                                    Generate
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-medium text-muted">
                                    Yêu cầu thêm (tuỳ chọn)
                                </label>
                                <textarea
                                    value={promptExtra}
                                    onChange={(e) => setPromptExtra(e.target.value)}
                                    placeholder="Ví dụ: Chủ đề HSK4, mỗi thẻ gồm: từ Hán tự, pinyin, nghĩa tiếng Việt; kèm 1 câu ví dụ ngắn..."
                                    className="h-24 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                                />
                                <div className="text-[11px] text-muted-foreground">
                                    Gợi ý: nêu số lượng thẻ, level, ngôn ngữ, và ràng buộc tránh dùng ký tự tách.
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-medium text-muted">
                                        Prompt (copy dán vào ChatGPT)
                                    </label>
                                    <button
                                        onClick={handleCopyPrompt}
                                        disabled={!generatedPrompt.trim()}
                                        className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${copied
                                                ? 'border-success/40 bg-success/10 text-success'
                                                : 'border-border text-foreground hover:bg-card-hover'
                                            }`}
                                    >
                                        {copied ? 'Đã copy' : 'Copy'}
                                    </button>
                                </div>
                                <textarea
                                    value={generatedPrompt}
                                    readOnly
                                    placeholder="Bấm Generate để tạo prompt…"
                                    className="h-64 w-full resize-none rounded-lg border border-border bg-background p-3 font-mono text-xs text-foreground focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Left Panel: Input & Settings */}
                        <div className="flex flex-1 flex-col gap-4 border-r border-border p-4 overflow-y-auto">

                            {/* Zone A: Paste Area */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="import-textarea" className="text-sm font-medium text-foreground">
                                    Dán nội dung
                                </label>
                                <PinyinTextarea
                                    id="import-textarea"
                                    value={rawText}
                                    onChange={(e) => setRawText(e.target.value)}
                                    onKeyDown={handleTextareaKeyDown}
                                    placeholder={"Ví dụ:\nTừ 1\tNghĩa 1\nTừ 2\tNghĩa 2\n\nHoặc:\nCâu hỏi 1 :: Trả lời 1\nCâu hỏi 2 :: Trả lời 2"}
                                    className="h-56 w-full rounded-lg border border-border bg-background p-4 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none"
                                    aria-label="Paste content for bulk import"
                                    onShowToast={(msg) => {
                                        // Show toast in ImportOverlay (could add toast state if needed)
                                        console.log('Pinyin toast:', msg);
                                    }}
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
                        <div className="flex flex-1 flex-col bg-background/50">
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
                                                    <div className="text-foreground whitespace-pre-wrap">
                                                        <SmartText text={row.card.term} />
                                                    </div>
                                                </div>
                                                <div className="flex-1 border-l border-border pl-4">
                                                    <div className="mb-1 text-[10px] uppercase text-muted/50 font-bold">Trả lời</div>
                                                    <div className="text-foreground whitespace-pre-wrap">
                                                        <SmartText text={row.card.definition} />
                                                    </div>
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
                                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {canImport ? `Nhập ${parsed.stats.valid} thẻ` : 'Nhập thẻ'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Modal */}
            {showConfirmModal && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
                >
                    <div
                        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
                        style={{ zoom: overlayScale }}
                    >
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
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
