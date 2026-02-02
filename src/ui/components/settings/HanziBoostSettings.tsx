'use client';

import { useState, useEffect } from 'react';
import { X, Settings } from 'lucide-react';

const STORAGE_KEY = 'ui:hanziBoostPx';
const DEFAULT_BOOST = 5;
const MIN_BOOST = 0;
const MAX_BOOST = 10;

/**
 * HanziBoostSettings Component
 * 
 * User control for adjusting Hanzi font-size boost.
 * Persists in localStorage and updates CSS variable.
 */
export function HanziBoostSettings() {
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

    return (
        <>
            {/* Settings Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                aria-label="Cài đặt hiển thị"
            >
                <Settings className="h-4 w-4" />
            </button>

            {/* Settings Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 rounded-lg p-2 text-muted hover:bg-card-hover hover:text-foreground transition-colors duration-200"
                            aria-label="Đóng"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Header */}
                        <h2 className="mb-4 text-xl font-semibold text-foreground">
                            Hiển thị
                        </h2>

                        {/* Boost Control */}
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

                        {/* Close Button */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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

