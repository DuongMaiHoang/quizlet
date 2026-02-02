'use client';

import { containsHan } from '@/ui/lib/typography';

interface SmartTextProps {
    /** The text content to render */
    text: string | null | undefined;
    /** Optional className to add to the wrapper */
    className?: string;
    /** Optional tag to use (default: span) */
    as?: 'span' | 'div' | 'p';
    /** Optional children (if provided, text is ignored) */
    children?: React.ReactNode;
}

/**
 * SmartText Component
 * 
 * Automatically applies .hanzi-text class to text containing Han characters.
 * This ensures KaiTi font + font-size boost for Chinese text everywhere.
 * 
 * Usage:
 *   <SmartText text="漢字" />
 *   <SmartText text="Hello" /> // No class applied
 */
export function SmartText({
    text,
    className = '',
    as: Component = 'span',
    children,
}: SmartTextProps) {
    // If children provided, use children; otherwise use text prop
    const content = children ?? text;
    
    // Handle null/undefined/empty
    if (!content) {
        return null;
    }
    
    // Convert to string for detection
    const contentStr = typeof content === 'string' ? content : String(content);
    
    // Check if contains Han characters
    const hasHan = containsHan(contentStr);
    
    // Apply hanzi-text class if contains Han
    const finalClassName = hasHan 
        ? `hanzi-text ${className}`.trim()
        : className;
    
    return (
        <Component className={finalClassName || undefined}>
            {content}
        </Component>
    );
}

