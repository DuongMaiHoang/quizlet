'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Settings } from 'lucide-react';
import { ColorSettings } from './ColorSettings';

const STORAGE_KEY = 'ui:hanziBoostPx';
const DEFAULT_BOOST = 5;
const MIN_BOOST = 0;
const MAX_BOOST = 10;

/**
 * AppSettings Component
 * 
 * Main settings button and modal for app-wide settings (colors, hanzi boost, etc.)
 */
export function AppSettings() {
    const [isOpen, setIsOpen] = useState(false);
    const [boost, setBoost] = useState(DEFAULT_BOOST);

    // Load boost from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        const initialBoost = saved !== null 
            ? (() => {
                const parsed = parseInt(saved, 10);
                return (!isNaN(parsed) && parsed >= MIN_BOOST && parsed <= MAX_BOOST) ? parsed : DEFAULT_BOOST;
            })()
            : DEFAULT_BOOST;
        setBoost(initialBoost);
        // Initialize CSS variable
        updateCSSVariable(initialBoost);
    }, []);

    // Update CSS variable when boost changes
    const updateCSSVariable = (value: number) => {
        document.documentElement.style.setProperty('--hanzi-boost', `${value}px`);
    };

    // Handle slider change
    const handleChange = (value: number) => {
        setBoost(value);
        updateCSSVariable(value);
        localStorage.setItem(STORAGE_KEY, value.toString());
    };

    // Handle Esc key to close modal
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <>
            {/* Settings Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                aria-label="Cài đặt"
            >
                <Settings className="h-4 w-4" />
            </button>

            {/* Settings Modal */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsOpen(false);
                        }
                    }}
                >
                    <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-lg flex flex-col max-h-[calc(100vh-32px)] my-auto">
                        {/* Header - Fixed */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                            <h2 className="text-xl font-semibold text-foreground">
                                Cài đặt
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg p-2 text-muted hover:bg-card-hover hover:text-foreground transition-colors duration-200"
                                aria-label="Đóng"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="overflow-y-auto flex-1 min-h-0 px-6 pt-4 pb-4 space-y-6">
                            {/* Color Settings */}
                            <div>
                                <h3 className="mb-3 text-lg font-semibold text-foreground border-b border-border pb-2">
                                    Màu sắc
                                </h3>
                                <ColorSettings />
                            </div>

                            {/* Hanzi Boost Settings */}
                            <div>
                                <h3 className="mb-4 text-lg font-semibold text-foreground border-b border-border pb-2">
                                    Hán tự
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-foreground">
                                            Tăng cỡ chữ Hán tự
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min={MIN_BOOST}
                                                max={MAX_BOOST}
                                                step={1}
                                                value={boost}
                                                onChange={(e) => handleChange(parseInt(e.target.value, 10))}
                                                className="flex-1"
                                            />
                                            <span className="min-w-[3rem] text-right text-sm font-medium text-foreground">
                                                +{boost}px
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Tăng kích thước chữ cho các ký tự Hán tự (0px - 10px)
                                        </p>
                                    </div>

                                    {/* Preview */}
                                    <div className="rounded-lg border border-border bg-background p-4">
                                        <p className="text-sm text-muted-foreground mb-2">Xem trước:</p>
                                        <div className="space-y-2">
                                            <p className="text-base">
                                                <span className="hanzi-text">漢字</span> (Hán tự)
                                            </p>
                                            <p className="text-base">
                                                <span>Hello</span> (Latin)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer - Fixed */}
                        <div className="px-6 py-3 border-t border-border flex justify-end flex-shrink-0">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
