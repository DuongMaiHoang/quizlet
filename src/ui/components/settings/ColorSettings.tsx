'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY_BG = 'ui:backgroundColor';
const STORAGE_KEY_TEXT = 'ui:textColor';
const DEFAULT_BG = '#0f172a';
const DEFAULT_TEXT = '#E5E7EB';

/**
 * ColorSettings Component
 * 
 * User control for adjusting background and text colors.
 * Persists in localStorage and updates CSS variables.
 */
export function ColorSettings() {
    const [bgColor, setBgColor] = useState(DEFAULT_BG);
    const [textColor, setTextColor] = useState(DEFAULT_TEXT);
    const [bgInput, setBgInput] = useState(DEFAULT_BG);
    const [textInput, setTextInput] = useState(DEFAULT_TEXT);
    const [bgError, setBgError] = useState('');
    const [textError, setTextError] = useState('');

    // Load colors from localStorage on mount
    useEffect(() => {
        const savedBg = localStorage.getItem(STORAGE_KEY_BG);
        const savedText = localStorage.getItem(STORAGE_KEY_TEXT);
        
        const initialBg = savedBg && isValidHex(savedBg) ? savedBg : DEFAULT_BG;
        const initialText = savedText && isValidHex(savedText) ? savedText : DEFAULT_TEXT;
        
        setBgColor(initialBg);
        setTextColor(initialText);
        setBgInput(initialBg);
        setTextInput(initialText);
        
        // Initialize CSS variables
        updateCSSVariables(initialBg, initialText);
    }, []);

    // Validate hex color
    const isValidHex = (color: string): boolean => {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    };

    // Update CSS variables
    const updateCSSVariables = (bg: string, text: string) => {
        document.documentElement.style.setProperty('--color-background', bg);
        document.documentElement.style.setProperty('--color-foreground', text);
    };

    // Handle background color input change
    const handleBgInputChange = (value: string) => {
        setBgInput(value);
        if (value && isValidHex(value)) {
            setBgError('');
        } else if (value) {
            setBgError('Mã màu không hợp lệ (ví dụ: #0f172a)');
        } else {
            setBgError('');
        }
    };

    // Handle text color input change
    const handleTextInputChange = (value: string) => {
        setTextInput(value);
        if (value && isValidHex(value)) {
            setTextError('');
        } else if (value) {
            setTextError('Mã màu không hợp lệ (ví dụ: #E5E7EB)');
        } else {
            setTextError('');
        }
    };

    // Apply background color
    const handleApplyBg = () => {
        if (isValidHex(bgInput)) {
            setBgColor(bgInput);
            updateCSSVariables(bgInput, textColor);
            localStorage.setItem(STORAGE_KEY_BG, bgInput);
            setBgError('');
        } else {
            setBgError('Mã màu không hợp lệ (ví dụ: #0f172a)');
        }
    };

    // Apply text color
    const handleApplyText = () => {
        if (isValidHex(textInput)) {
            setTextColor(textInput);
            updateCSSVariables(bgColor, textInput);
            localStorage.setItem(STORAGE_KEY_TEXT, textInput);
            setTextError('');
        } else {
            setTextError('Mã màu không hợp lệ (ví dụ: #E5E7EB)');
        }
    };

    // Reset to defaults
    const handleReset = () => {
        setBgColor(DEFAULT_BG);
        setTextColor(DEFAULT_TEXT);
        setBgInput(DEFAULT_BG);
        setTextInput(DEFAULT_TEXT);
        updateCSSVariables(DEFAULT_BG, DEFAULT_TEXT);
        localStorage.setItem(STORAGE_KEY_BG, DEFAULT_BG);
        localStorage.setItem(STORAGE_KEY_TEXT, DEFAULT_TEXT);
        setBgError('');
        setTextError('');
    };

    return (
        <div className="space-y-6">
            {/* Background Color */}
            <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                    Màu nền (Background)
                </label>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div 
                            className="h-10 w-16 rounded border border-border flex-shrink-0"
                            style={{ backgroundColor: bgColor }}
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={bgInput}
                                    onChange={(e) => handleBgInputChange(e.target.value)}
                                    placeholder="#0f172a"
                                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <button
                                    onClick={handleApplyBg}
                                    disabled={!isValidHex(bgInput) || bgInput === bgColor}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Áp dụng
                                </button>
                            </div>
                            {bgError && (
                                <p className="mt-1 text-xs text-error">{bgError}</p>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Mã màu hiện tại: <code className="px-1 py-0.5 rounded bg-background border border-border">{bgColor}</code>
                    </p>
                </div>
            </div>

            {/* Text Color */}
            <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                    Màu chữ (Text)
                </label>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div 
                            className="h-10 w-16 rounded border border-border flex-shrink-0"
                            style={{ backgroundColor: textColor }}
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => handleTextInputChange(e.target.value)}
                                    placeholder="#E5E7EB"
                                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <button
                                    onClick={handleApplyText}
                                    disabled={!isValidHex(textInput) || textInput === textColor}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Áp dụng
                                </button>
                            </div>
                            {textError && (
                                <p className="mt-1 text-xs text-error">{textError}</p>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Mã màu hiện tại: <code className="px-1 py-0.5 rounded bg-background border border-border">{textColor}</code>
                    </p>
                </div>
            </div>

            {/* Reset Button */}
            <div className="pt-2 border-t border-border">
                <button
                    onClick={handleReset}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                    Đặt lại mặc định
                </button>
            </div>
        </div>
    );
}

