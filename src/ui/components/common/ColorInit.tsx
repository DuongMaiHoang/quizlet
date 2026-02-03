'use client';

import { useEffect } from 'react';

const STORAGE_KEY_BG = 'ui:backgroundColor';
const STORAGE_KEY_TEXT = 'ui:textColor';
const DEFAULT_BG = '#0f172a';
const DEFAULT_TEXT = '#E5E7EB';

/**
 * ColorInit Component
 * 
 * Initializes color CSS variables from localStorage on app load.
 */
export function ColorInit() {
    useEffect(() => {
        const savedBg = localStorage.getItem(STORAGE_KEY_BG);
        const savedText = localStorage.getItem(STORAGE_KEY_TEXT);
        
        const bg = savedBg && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(savedBg) 
            ? savedBg 
            : DEFAULT_BG;
        const text = savedText && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(savedText)
            ? savedText
            : DEFAULT_TEXT;
        
        document.documentElement.style.setProperty('--color-background', bg);
        document.documentElement.style.setProperty('--color-foreground', text);
    }, []);

    return null;
}

