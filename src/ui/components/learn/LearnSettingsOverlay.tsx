'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { LearnSettingsV2 } from '@/ui/lib/learn/learnSettingsPersistence';

interface LearnSettingsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (settings: LearnSettingsV2) => void;
    initialSettings: LearnSettingsV2;
    availableTypes: {
        mcq: boolean;
        multiSelect: boolean;
        written: boolean;
    };
}

/**
 * Learn Mode v2 - Settings Overlay Component
 *
 * BR-LRN-V2-001..004: Overlay open/close behavior
 * BR-LRN-V2-010: Apply button behavior
 * BR-LRN-V2-020: Validation rules
 */
export function LearnSettingsOverlay({
    isOpen,
    onClose,
    onApply,
    initialSettings,
    availableTypes,
}: LearnSettingsOverlayProps) {
    const [settings, setSettings] = useState<LearnSettingsV2>(initialSettings);
    const [validationError, setValidationError] = useState<string | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const firstFocusableRef = useRef<HTMLButtonElement>(null);

    // Reset to initial settings when overlay opens
    useEffect(() => {
        if (isOpen) {
            setSettings(initialSettings);
            setValidationError(null);
            // Focus first element for accessibility
            setTimeout(() => {
                firstFocusableRef.current?.focus();
            }, 100);
        }
    }, [isOpen, initialSettings]);

    // ESC key handler
    useEffect(() => {
        if (!isOpen) return;

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Focus trap (basic)
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

        window.addEventListener('keydown', handleTab);
        return () => window.removeEventListener('keydown', handleTab);
    }, [isOpen]);

    const handleToggle = (path: keyof LearnSettingsV2['questionTypes'] | keyof LearnSettingsV2['options']) => {
        setValidationError(null);

        if (path in settings.questionTypes) {
            setSettings((prev) => ({
                ...prev,
                questionTypes: {
                    ...prev.questionTypes,
                    [path]: !prev.questionTypes[path as keyof typeof prev.questionTypes],
                },
            }));
        } else if (path in settings.options) {
            setSettings((prev) => ({
                ...prev,
                options: {
                    ...prev.options,
                    [path]: !prev.options[path as keyof typeof prev.options],
                },
            }));
        }
    };

    const handleApply = () => {
        // BR-LRN-V2-020: Validate at least one available type is enabled
        const hasAvailableTypeEnabled =
            (availableTypes.mcq && settings.questionTypes.mcqEnabled) ||
            (availableTypes.multiSelect && settings.questionTypes.multiSelectEnabled) ||
            (availableTypes.written && settings.questionTypes.writtenEnabled);

        if (!hasAvailableTypeEnabled) {
            setValidationError('Hãy chọn ít nhất 1 loại câu hỏi.');
            return;
        }

        onApply(settings);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            data-testid="learn-settings-overlay"
            onClick={(e) => {
                // Optional backdrop close - only if clicking backdrop itself
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                ref={overlayRef}
                className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">Tùy chọn</h2>
                    <button
                        ref={firstFocusableRef}
                        type="button"
                        onClick={onClose}
                        data-testid="learn-settings-close"
                        className="rounded-lg p-2 text-muted hover:bg-card-hover hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
                    <div className="space-y-3">
                        {/* MCQ Toggle */}
                        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                            <div className="flex-1">
                                <label
                                    htmlFor="toggle-mcq"
                                    className="block text-sm font-medium text-foreground cursor-pointer"
                                >
                                    Trắc nghiệm
                                </label>
                            </div>
                            <button
                                id="toggle-mcq"
                                type="button"
                                role="switch"
                                aria-checked={settings.questionTypes.mcqEnabled}
                                onClick={() => handleToggle('mcqEnabled')}
                                disabled={!availableTypes.mcq}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                    settings.questionTypes.mcqEnabled
                                        ? 'bg-primary'
                                        : 'bg-border'
                                } ${!availableTypes.mcq ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                        settings.questionTypes.mcqEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Multi-select Toggle */}
                        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                            <div className="flex-1">
                                <label
                                    htmlFor="toggle-multiselect"
                                    className="block text-sm font-medium text-foreground"
                                >
                                    Chọn tất cả đáp án đúng
                                </label>
                                {!availableTypes.multiSelect && (
                                    <p className="mt-1 text-xs text-muted">Sắp có</p>
                                )}
                            </div>
                            <button
                                id="toggle-multiselect"
                                type="button"
                                role="switch"
                                aria-checked={settings.questionTypes.multiSelectEnabled}
                                onClick={() => handleToggle('multiSelectEnabled')}
                                disabled={!availableTypes.multiSelect}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                    settings.questionTypes.multiSelectEnabled
                                        ? 'bg-primary'
                                        : 'bg-border'
                                } ${!availableTypes.multiSelect ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                            <div className="flex-1">
                                <label
                                    htmlFor="toggle-written"
                                    className="block text-sm font-medium text-foreground"
                                >
                                    Tự luận
                                </label>
                                {!availableTypes.written && (
                                    <p className="mt-1 text-xs text-muted">Sắp có</p>
                                )}
                            </div>
                            <button
                                id="toggle-written"
                                type="button"
                                role="switch"
                                aria-checked={settings.questionTypes.writtenEnabled}
                                onClick={() => handleToggle('writtenEnabled')}
                                disabled={!availableTypes.written}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                    settings.questionTypes.writtenEnabled ? 'bg-primary' : 'bg-border'
                                } ${!availableTypes.written ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                        settings.questionTypes.writtenEnabled ? 'translate-x-6' : 'translate-x-1'
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
                    <div className="space-y-3">
                        {/* Shuffle Toggle */}
                        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                            <div className="flex-1">
                                <label
                                    htmlFor="toggle-shuffle"
                                    className="block text-sm font-medium text-foreground cursor-pointer"
                                >
                                    Trộn câu hỏi
                                </label>
                            </div>
                            <button
                                id="toggle-shuffle"
                                type="button"
                                role="switch"
                                aria-checked={settings.options.shuffleQuestions}
                                onClick={() => handleToggle('shuffleQuestions')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${
                                    settings.options.shuffleQuestions ? 'bg-primary' : 'bg-border'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                        settings.options.shuffleQuestions ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Sound Effects Toggle */}
                        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                            <div className="flex-1">
                                <label
                                    htmlFor="toggle-sound"
                                    className="block text-sm font-medium text-foreground"
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
                                onClick={() => handleToggle('soundEffects')}
                                disabled={true}
                                className="relative inline-flex h-6 w-11 items-center rounded-full bg-border opacity-50 cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <span className="inline-block h-4 w-4 translate-x-1 transform rounded-full bg-white transition-transform duration-200" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Validation Error */}
                {validationError && (
                    <div className="mb-4 rounded-lg border border-error bg-error/10 p-3 text-sm text-error">
                        {validationError}
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                        Đóng
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        data-testid="learn-settings-apply"
                        className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                        Áp dụng
                    </button>
                </div>
            </div>
        </div>
    );
}

