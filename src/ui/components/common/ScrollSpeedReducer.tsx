'use client';

import { useEffect } from 'react';

/**
 * ScrollSpeedReducer Component
 * 
 * Reduces mouse wheel scroll speed to 88% of original.
 * Attaches wheel event listener to reduce scroll delta.
 */
export function ScrollSpeedReducer() {
    useEffect(() => {
        let isScrolling = false;

        const handleWheel = (e: WheelEvent) => {
            // Prevent multiple rapid scrolls
            if (isScrolling) {
                e.preventDefault();
                return;
            }

            // Only reduce scroll speed for vertical scrolling
            if (Math.abs(e.deltaY) > 0) {
                isScrolling = true;
                
                // Reduce scroll speed to 88%
                const reducedDelta = e.deltaY * 0.88;
                
                // Apply reduced scroll smoothly
                window.scrollBy({
                    top: reducedDelta,
                    behavior: 'auto'
                });
                
                // Prevent default scroll to use our custom scroll
                e.preventDefault();
                
                // Reset flag after a short delay
                setTimeout(() => {
                    isScrolling = false;
                }, 50);
            }
        };

        // Add event listener with passive: false to allow preventDefault
        window.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, []);

    return null; // This component doesn't render anything
}
