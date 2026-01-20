'use client';

/**
 * Flashcards Study Mode - Canonical Route
 * 
 * Route: /study/:setId/flashcards
 * 
 * This is a thin wrapper that imports and reuses the actual implementation
 * from /sets/:setId/study/flashcards to maintain backward compatibility
 * and avoid code duplication.
 * 
 * The requirement specifies /study/:setId/flashcards as the canonical route,
 * while /sets/:setId/study/flashcards remains for backward compatibility.
 */
import FlashcardsPage from '@/app/sets/[id]/study/flashcards/page';

export default FlashcardsPage;
