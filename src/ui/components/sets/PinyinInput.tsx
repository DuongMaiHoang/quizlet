'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePinyinShortcut } from '@/ui/hooks/usePinyinShortcut';
import { convertPinyinToTones, containsPinyinTones } from '@/ui/lib/pinyin';
import { getKaitiClass } from '@/ui/lib/typography';

interface PinyinInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onShowToast?: (message: string) => void;
}

/**
 * PinyinInput Component
 * 
 * Wraps an input field with Pinyin mode toggle support via Alt+P shortcut.
 * Per-field Pinyin mode: each input maintains its own toggle state.
 */
export function PinyinInput({
    value,
    onChange,
    onShowToast,
    className = '',
    ...inputProps
}: PinyinInputProps) {
    const [pinyinEnabled, setPinyinEnabled] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastValueRef = useRef(value);

    // Track focus state
    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);

            // BR-PY-111: Convert Pinyin on blur if enabled
            if (pinyinEnabled && containsPinyinTones(e.target.value)) {
                const converted = convertPinyinToTones(e.target.value);
                if (converted !== e.target.value) {
                    // Create synthetic event to update value
                    const syntheticEvent = {
                        ...e,
                        target: { ...e.target, value: converted },
                        currentTarget: { ...e.currentTarget, value: converted },
                    } as React.ChangeEvent<HTMLInputElement>;
                    onChange(syntheticEvent);
                }
            }

            // Call original onBlur if provided
            if (inputProps.onBlur) {
                inputProps.onBlur(e);
            }
        },
        [pinyinEnabled, onChange, inputProps]
    );

    // Handle IME composition events
    const handleCompositionStart = useCallback(() => {
        setIsComposing(true);
    }, []);

    const handleCompositionEnd = useCallback(
        (e: React.CompositionEvent<HTMLInputElement>) => {
            setIsComposing(false);

            // BR-PY-113: Convert after composition ends if Pinyin enabled
            if (pinyinEnabled && containsPinyinTones(e.currentTarget.value)) {
                const converted = convertPinyinToTones(e.currentTarget.value);
                if (converted !== e.currentTarget.value) {
                    const syntheticEvent = {
                        ...e,
                        target: { ...e.currentTarget, value: converted },
                        currentTarget: { ...e.currentTarget, value: converted },
                    } as React.ChangeEvent<HTMLInputElement>;
                    onChange(syntheticEvent);
                }
            }

            // Call original onCompositionEnd if provided
            if (inputProps.onCompositionEnd) {
                inputProps.onCompositionEnd(e);
            }
        },
        [pinyinEnabled, onChange, inputProps]
    );

    // Handle input change with Pinyin conversion on space
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;

            // BR-PY-111: Convert Pinyin on space if enabled
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

    // Toggle Pinyin mode
    const handleToggle = useCallback(
        (newState: boolean) => {
            setPinyinEnabled(newState);
        },
        []
    );

    // Use Pinyin shortcut hook
    usePinyinShortcut({
        enabled: pinyinEnabled,
        onToggle: handleToggle,
        onShowToast,
        isFocused,
        isComposing,
    });

    // Update lastValueRef when value prop changes externally
    useEffect(() => {
        lastValueRef.current = value;
    }, [value]);

    return (
        <input
            {...inputProps}
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            className={`${className} ${getKaitiClass(value)}`}
        />
    );
}

