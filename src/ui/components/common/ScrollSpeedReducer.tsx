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

        const SCROLL_MULTIPLIER = 0.88;

        const isScrollable = (el: HTMLElement) => {
            const style = window.getComputedStyle(el);
            const overflowY = style.overflowY;
            const canScrollY = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
            return canScrollY && el.scrollHeight > el.clientHeight;
        };

        const findScrollableAncestor = (start: EventTarget | null): HTMLElement | null => {
            let el = start instanceof HTMLElement ? start : null;
            while (el) {
                if (isScrollable(el)) return el;
                el = el.parentElement;
            }
            return null;
        };

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
                const reducedDelta = e.deltaY * SCROLL_MULTIPLIER;

                // If the wheel event happens inside a scrollable overlay/container,
                // scroll that container instead of scrolling the main window.
                const scrollContainer = findScrollableAncestor(e.target);
                if (scrollContainer) {
                    scrollContainer.scrollTop += reducedDelta;
                    e.preventDefault();
                } else {
                    // Fallback: scroll the main window
                    window.scrollBy({
                        top: reducedDelta,
                        behavior: 'auto',
                    });
                    e.preventDefault();
                }
                
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
