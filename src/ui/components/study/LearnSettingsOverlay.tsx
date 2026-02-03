'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Settings } from 'lucide-react';
import type { LearnSettingsV2 } from '@/ui/lib/learn/learnSettings';
import { isQuestionTypeAvailable } from '@/ui/lib/learn/learnSettings';

interface LearnSettingsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (settings: LearnSettingsV2) => void;
    initialSettings: LearnSettingsV2;
}

/**
 * Learn Mode v2 - Settings Overlay Component
 *
 * BR-LRN-V2-001..004, BR-LRN-V2-010, BR-LRN-V2-020
 */
export function LearnSettingsOverlay({
    isOpen,
    onClose,
    onApply,
    initialSettings,
}: LearnSettingsOverlayProps) {
    const [settings, setSettings] = useState<LearnSettingsV2>(initialSettings);
    const [validationError, setValidationError] = useState<string | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const firstFocusableRef = useRef<HTMLButtonElement>(null);

    // Reset settings when overlay opens
    useEffect(() => {
        if (isOpen) {
            setSettings(initialSettings);
            setValidationError(null);
            // Focus first focusable element
            setTimeout(() => {
                firstFocusableRef.current?.focus();
            }, 100);
        }
    }, [isOpen, initialSettings]);

    // ESC key handler (BR-LRN-V2-003)
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    // Focus trap (basic accessibility)
    useEffect(() => {
        if (!isOpen) return;

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const focusableElements = overlayRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusableElements || focusableElements.length === 0) return;

            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        document.addEventListener('keydown', handleTab);
        return () => {
            document.removeEventListener('keydown', handleTab);
        };
    }, [isOpen]);

    const handleToggle = (
        category: 'questionTypes' | 'options',
        key: string,
        value: boolean
    ) => {
        setSettings((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value,
            },
        }));
        setValidationError(null);
    };

    const handleApply = () => {
        // Validation: at least one available type enabled (BR-LRN-V2-020)
        const availableTypes = [
            { key: 'mcqEnabled', available: isQuestionTypeAvailable('mcq') },
            { key: 'multiSelectEnabled', available: isQuestionTypeAvailable('multiSelect') },
            { key: 'writtenEnabled', available: isQuestionTypeAvailable('written') },
        ];

        const enabledAvailableTypes = availableTypes.filter(
            (t) => t.available && settings.questionTypes[t.key as keyof typeof settings.questionTypes]
        );

        if (enabledAvailableTypes.length === 0) {
            setValidationError('Hãy chọn ít nhất 1 loại câu hỏi.');
            return;
        }

        onApply(settings);
        onClose();
    };

    if (!isOpen) return null;

    const mcqAvailable = isQuestionTypeAvailable('mcq');
    const multiSelectAvailable = isQuestionTypeAvailable('multiSelect');
    const writtenAvailable = isQuestionTypeAvailable('written');

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
            data-testid="learn-settings-overlay"
        >
            <div
                ref={overlayRef}
                className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
            >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold text-foreground">Tùy chọn</h2>
                    </div>
                    <button
                        ref={firstFocusableRef}
                        onClick={onClose}
                        data-testid="learn-settings-close"
                        className="rounded-lg p-1 text-muted hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        aria-label="Đóng"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Section A: Question Types */}
                <div className="mb-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
                        Loại câu hỏi
                    </h3>
                    <div className="space-y-4">
                        {/* MCQ Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <label
                                    htmlFor="toggle-mcq"
                                    className="text-sm font-medium text-foreground cursor-pointer"
                                >
                                    Trắc nghiệm
                                </label>
                            </div>
                            <button
                                id="toggle-mcq"
                                type="button"
                                role="switch"
                                aria-checked={settings.questionTypes.mcqEnabled}
                                onClick={() =>
                                    handleToggle(
                                        'questionTypes',
                                        'mcqEnabled',
                                        !settings.questionTypes.mcqEnabled
                                    )
                                }
                                disabled={!mcqAvailable}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                    settings.questionTypes.mcqEnabled
                                        ? 'bg-primary'
                                        : 'bg-border'
                                } ${!mcqAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                        settings.questionTypes.mcqEnabled
                                            ? 'translate-x-6'
                                            : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Multi-select Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <label
                                    htmlFor="toggle-multiselect"
                                    className="text-sm font-medium text-foreground"
                                >
                                    Chọn tất cả đáp án đúng
                                </label>
                                {!multiSelectAvailable && (
                                    <p className="mt-1 text-xs text-muted">Sắp có</p>
                                )}
                            </div>
                            <button
                                id="toggle-multiselect"
                                type="button"
                                role="switch"
                                aria-checked={settings.questionTypes.multiSelectEnabled}
                                onClick={() =>
                                    handleToggle(
                                        'questionTypes',
                                        'multiSelectEnabled',
                                        !settings.questionTypes.multiSelectEnabled
                                    )
                                }
                                disabled={!multiSelectAvailable}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                    settings.questionTypes.multiSelectEnabled
                                        ? 'bg-primary'
                                        : 'bg-border'
                                } ${!multiSelectAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                        settings.questionTypes.multiSelectEnabled
                                            ? 'translate-x-6'
                                            : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Written Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <label
                                    htmlFor="toggle-written"
                                    className="text-sm font-medium text-foreground"
                                >
                                    Tự luận
                                </label>
                                {!writtenAvailable && (
                                    <p className="mt-1 text-xs text-muted">Sắp có</p>
                                )}
                            </div>
                            <button
                                id="toggle-written"
                                type="button"
                                role="switch"
                                aria-checked={settings.questionTypes.writtenEnabled}
                                onClick={() =>
                                    handleToggle(
                                        'questionTypes',
                                        'writtenEnabled',
                                        !settings.questionTypes.writtenEnabled
                                    )
                                }
                                disabled={!writtenAvailable}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                    settings.questionTypes.writtenEnabled
                                        ? 'bg-primary'
                                        : 'bg-border'
                                } ${!writtenAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                        settings.questionTypes.writtenEnabled
                                            ? 'translate-x-6'
                                            : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section B: Other Options */}
                <div className="mb-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
                        Tùy chọn khác
                    </h3>
                    <div className="space-y-4">
                        {/* Shuffle Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <label
                                    htmlFor="toggle-shuffle"
                                    className="text-sm font-medium text-foreground cursor-pointer"
                                >
                                    Trộn câu hỏi
                                </label>
                            </div>
                            <button
                                id="toggle-shuffle"
                                type="button"
                                role="switch"
                                aria-checked={settings.options.shuffleQuestions}
                                onClick={() =>
                                    handleToggle(
                                        'options',
                                        'shuffleQuestions',
                                        !settings.options.shuffleQuestions
                                    )
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${
                                    settings.options.shuffleQuestions ? 'bg-primary' : 'bg-border'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                        settings.options.shuffleQuestions
                                            ? 'translate-x-6'
                                            : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Sound Effects Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <label
                                    htmlFor="toggle-sound"
                                    className="text-sm font-medium text-foreground"
                                >
                                    Hiệu ứng âm thanh
                                </label>
                                <p className="mt-1 text-xs text-muted">Sắp có</p>
                            </div>
                            <button
                                id="toggle-sound"
                                type="button"
                                role="switch"
                                aria-checked={settings.options.soundEffects}
                                onClick={() =>
                                    handleToggle(
                                        'options',
                                        'soundEffects',
                                        !settings.options.soundEffects
                                    )
                                }
                                disabled
                                className="relative inline-flex h-6 w-11 items-center rounded-full bg-border opacity-50 cursor-not-allowed transition-colors duration-200"
                            >
                                <span className="inline-block h-4 w-4 transform translate-x-1 rounded-full bg-white transition-transform duration-200" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Validation Error */}
                {validationError && (
                    <div className="mb-4 rounded-lg border border-error/50 bg-error/10 p-3 text-sm text-error">
                        {validationError}
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                        Đóng
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        data-testid="learn-settings-apply"
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                        Áp dụng
                    </button>
                </div>
            </div>
        </div>
    );
}

