'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'ui:hanziBoostPx';
const DEFAULT_BOOST = 5;

/**
 * HanziBoostInit Component
 * 
 * Initializes CSS variable for Hanzi font-size boost on app boot.
 * Reads from localStorage and sets on document.documentElement.
 * 
 * Should be included in root layout or a top-level component.
 */
export function HanziBoostInit() {
    useEffect(() => {
        // Read boost from localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        const boost = saved !== null 
            ? (() => {
                const parsed = parseInt(saved, 10);
                return (!isNaN(parsed) && parsed >= 0 && parsed <= 10) ? parsed : DEFAULT_BOOST;
            })()
            : DEFAULT_BOOST;
        
        // Set CSS variable on document root
        document.documentElement.style.setProperty('--hanzi-boost', `${boost}px`);
    }, []);

    return null; // This component doesn't render anything
}

