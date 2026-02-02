/**
 * Pinyin Input Support v1.1 - Keyboard Shortcut Hook
 * 
 * Handles Alt+P shortcut to toggle Pinyin mode for input fields.
 */

import { useEffect, useRef, useCallback } from 'react';

export interface UsePinyinShortcutOptions {
    /** Whether Pinyin mode is currently enabled */
    enabled: boolean;
    /** Callback when toggle is triggered */
    onToggle: (newState: boolean) => void;
    /** Callback to show toast message */
    onShowToast?: (message: string) => void;
    /** Whether the input is currently focused */
    isFocused: boolean;
    /** Whether IME composition is in progress */
    isComposing?: boolean;
}

/**
 * Hook to handle Alt+P keyboard shortcut for Pinyin toggle.
 * 
 * Only active when input is focused and not during IME composition.
 */
export function usePinyinShortcut({
    enabled,
    onToggle,
    onShowToast,
    isFocused,
    isComposing = false,
}: UsePinyinShortcutOptions) {
    const isComposingRef = useRef(false);

    useEffect(() => {
        isComposingRef.current = isComposing;
    }, [isComposing]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            // Only handle when input is focused
            if (!isFocused) return;

            // Don't interrupt IME composition
            if (isComposingRef.current) return;

            // Check for Alt+P
            if (e.altKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                e.stopPropagation();

                const newState = !enabled;
                onToggle(newState);

                // Show toast
                if (onShowToast) {
                    const message = newState ? 'Pinyin: BẬT' : 'Pinyin: TẮT';
                    onShowToast(message);
                }
            }
        },
        [enabled, isFocused, onToggle, onShowToast]
    );

    useEffect(() => {
        if (!isFocused) return;

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFocused, handleKeyDown]);
}



