'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePinyinShortcut } from '@/ui/hooks/usePinyinShortcut';
import { convertPinyinToTones, containsPinyinTones } from '@/ui/lib/pinyin';

interface PinyinTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onShowToast?: (message: string) => void;
}

/**
 * PinyinTextarea Component
 * 
 * Wraps a textarea field with Pinyin mode toggle support via Alt+P shortcut.
 */
export function PinyinTextarea({
    value,
    onChange,
    onShowToast,
    className = '',
    ...textareaProps
}: PinyinTextareaProps) {
    const [pinyinEnabled, setPinyinEnabled] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastValueRef = useRef(value);

    // Track focus state
    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur = useCallback(
        (e: React.FocusEvent<HTMLTextAreaElement>) => {
            setIsFocused(false);

            // Convert Pinyin on blur if enabled
            if (pinyinEnabled && containsPinyinTones(e.target.value)) {
                const converted = convertPinyinToTones(e.target.value);
                if (converted !== e.target.value) {
                    const syntheticEvent = {
                        ...e,
                        target: { ...e.target, value: converted },
                        currentTarget: { ...e.currentTarget, value: converted },
                    } as React.ChangeEvent<HTMLTextAreaElement>;
                    onChange(syntheticEvent);
                }
            }

            if (textareaProps.onBlur) {
                textareaProps.onBlur(e);
            }
        },
        [pinyinEnabled, onChange, textareaProps]
    );

    // Handle IME composition events
    const handleCompositionStart = useCallback(() => {
        setIsComposing(true);
    }, []);

    const handleCompositionEnd = useCallback(
        (e: React.CompositionEvent<HTMLTextAreaElement>) => {
            setIsComposing(false);

            if (pinyinEnabled && containsPinyinTones(e.currentTarget.value)) {
                const converted = convertPinyinToTones(e.currentTarget.value);
                if (converted !== e.currentTarget.value) {
                    const syntheticEvent = {
                        ...e,
                        target: { ...e.currentTarget, value: converted },
                        currentTarget: { ...e.currentTarget, value: converted },
                    } as React.ChangeEvent<HTMLTextAreaElement>;
                    onChange(syntheticEvent);
                }
            }

            if (textareaProps.onCompositionEnd) {
                textareaProps.onCompositionEnd(e);
            }
        },
        [pinyinEnabled, onChange, textareaProps]
    );

    // Handle input change with Pinyin conversion on space
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = e.target.value;

            if (pinyinEnabled && newValue.endsWith(' ') && containsPinyinTones(newValue)) {
                const converted = convertPinyinToTones(newValue);
                if (converted !== newValue) {
                    e.target.value = converted;
                }
            }

            lastValueRef.current = newValue;
            onChange(e);
        },
        [pinyinEnabled, onChange]
    );

    // Handle keydown - call custom handler if provided, then handle Alt+P
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            // Call custom onKeyDown first if provided
            if (textareaProps.onKeyDown) {
                textareaProps.onKeyDown(e);
                // If custom handler prevented default, don't process Alt+P
                if (e.defaultPrevented) return;
            }

            // Handle Alt+P for Pinyin toggle (only if not prevented)
            if (isFocused && !isComposing && e.altKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                e.stopPropagation();

                const newState = !pinyinEnabled;
                setPinyinEnabled(newState);

                if (onShowToast) {
                    const message = newState ? 'Pinyin: BẬT' : 'Pinyin: TẮT';
                    onShowToast(message);
                }
            }
        },
        [isFocused, isComposing, pinyinEnabled, onShowToast, textareaProps]
    );

    // Toggle Pinyin mode
    const handleToggle = useCallback(
        (newState: boolean) => {
            setPinyinEnabled(newState);
        },
        []
    );

    // Don't use window-level hook when custom onKeyDown exists (handle in handleKeyDown instead)
    // This prevents double handling of Alt+P

    useEffect(() => {
        lastValueRef.current = value;
    }, [value]);

    return (
        <textarea
            {...textareaProps}
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            className={className}
        />
    );
}

