import { create } from 'zustand';
import { FlashcardsProgress } from '@/domain/entities/FlashcardsProgress';
import { CardKey } from '@/domain/value-objects/CardKey';
import { CardStatus, OrderMode, CardSide } from '@/domain/entities/FlashcardsProgress';
import { container } from '@/lib/di';

/**
 * Flashcards Store State
 * 
 * Manages flashcards session state with persistence.
 * BR-PERSIST-01: Immediate persistence on state changes
 */
interface FlashcardsStoreState {
    // Progress data
    progress: FlashcardsProgress | null;
    
    // Current card order (for display)
    cardOrder: string[]; // Array of CardKey strings
    
    // Loading state
    isLoading: boolean;
    error: string | null;
    
    // Actions
    loadProgress: (setId: string, originalCardKeys: string[]) => Promise<void>;
    flip: () => Promise<void>;
    next: () => Promise<void>;
    prev: () => Promise<void>;
    markKnow: (cardKey: CardKey) => Promise<void>;
    markLearning: (cardKey: CardKey) => Promise<void>;
    toggleShuffle: (originalCardKeys: string[]) => Promise<void>;
    resetProgress: (setId: string) => Promise<void>;
    setIndex: (index: number) => Promise<void>;
}

/**
 * Generate deterministic shuffle order using seed
 */
function generateShuffledOrder(cardKeys: string[], seed: string): string[] {
    // Simple seeded shuffle using seed as number
    const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const shuffled = [...cardKeys];
    
    // Use seed-based random
    let random = seedNum;
    function seededRandom() {
        random = (random * 9301 + 49297) % 233280;
        return random / 233280;
    }
    
    // Fisher-Yates with seeded random
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
}

export const useFlashcardsStore = create<FlashcardsStoreState>((set, get) => ({
    progress: null,
    cardOrder: [],
    isLoading: false,
    error: null,

    /**
     * Load progress for a set
     * BR-PERSIST-02: Restore progress on load
     */
    loadProgress: async (setId: string, originalCardKeys: string[]) => {
        set({ isLoading: true, error: null });
        
        try {
            const progress = await container.loadFlashcardsProgress.execute(setId);
            
            // Determine card order based on progress.order
            let cardOrder: string[];
            if (progress.order === 'shuffled') {
                if (progress.shuffledOrder && progress.shuffledOrder.length === originalCardKeys.length) {
                    // Use stored shuffled order
                    cardOrder = progress.shuffledOrder;
                } else if (progress.shuffledSeed) {
                    // Generate from seed
                    cardOrder = generateShuffledOrder(originalCardKeys, progress.shuffledSeed);
                } else {
                    // Fallback: generate new shuffle
                    const seed = Date.now().toString();
                    cardOrder = generateShuffledOrder(originalCardKeys, seed);
                    progress.setOrder('shuffled', cardOrder, seed);
                    await container.saveFlashcardsProgress.execute(progress);
                }
            } else {
                cardOrder = originalCardKeys;
            }
            
            // BR-FLIP-03: Reset side to term on load (recommended)
            if (progress.side !== 'term') {
                progress.setIndex(progress.index);
            }
            
            set({ 
                progress, 
                cardOrder,
                isLoading: false 
            });
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to load progress',
                isLoading: false 
            });
        }
    },

    /**
     * Flip card side
     * BR-FLIP-01, BR-FLIP-02
     */
    flip: async () => {
        const { progress } = get();
        if (!progress) return;
        
        progress.flip();
        await container.saveFlashcardsProgress.execute(progress);
        set({ progress });
    },

    /**
     * Navigate to next card
     * BR-NAV-01
     */
    next: async () => {
        const { progress, cardOrder } = get();
        if (!progress || progress.index >= cardOrder.length - 1) return;
        
        progress.setIndex(progress.index + 1);
        await container.saveFlashcardsProgress.execute(progress);
        set({ progress });
    },

    /**
     * Navigate to previous card
     * BR-NAV-02
     */
    prev: async () => {
        const { progress } = get();
        if (!progress || progress.index <= 0) return;
        
        progress.setIndex(progress.index - 1);
        await container.saveFlashcardsProgress.execute(progress);
        set({ progress });
    },

    /**
     * Mark card as Know
     * BR-KNOW-01
     */
    markKnow: async (cardKey: CardKey) => {
        const { progress } = get();
        if (!progress) return;
        
        const currentStatus = progress.getCardStatus(cardKey);
        
        // BR-SET-02: Allow unset by clicking active state again
        if (currentStatus === 'know') {
            progress.unsetCard(cardKey);
        } else {
            progress.markKnow(cardKey);
        }
        
        await container.saveFlashcardsProgress.execute(progress);
        set({ progress });
    },

    /**
     * Mark card as Still learning
     * BR-LEARN-01
     */
    markLearning: async (cardKey: CardKey) => {
        const { progress } = get();
        if (!progress) return;
        
        const currentStatus = progress.getCardStatus(cardKey);
        
        // BR-SET-02: Allow unset by clicking active state again
        if (currentStatus === 'learning') {
            progress.unsetCard(cardKey);
        } else {
            progress.markLearning(cardKey);
        }
        
        await container.saveFlashcardsProgress.execute(progress);
        set({ progress });
    },

    /**
     * Toggle shuffle on/off
     * BR-SHUFF-01, BR-SHUFF-02
     */
    toggleShuffle: async (originalCardKeys: string[]) => {
        const { progress } = get();
        if (!progress) return;
        
        if (progress.order === 'original') {
            // Turn ON shuffle
            const seed = Date.now().toString();
            const shuffledOrder = generateShuffledOrder(originalCardKeys, seed);
            progress.setOrder('shuffled', shuffledOrder, seed);
            set({ cardOrder: shuffledOrder });
        } else {
            // Turn OFF shuffle
            progress.setOrder('original');
            set({ cardOrder: originalCardKeys });
        }
        
        await container.saveFlashcardsProgress.execute(progress);
        set({ progress });
    },

    /**
     * Reset progress
     * BR-RESET-02
     */
    resetProgress: async (setId: string) => {
        try {
            const progress = await container.resetFlashcardsProgress.execute(setId);
            set({ progress, cardOrder: [] }); // Will be set by loadProgress
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to reset progress' });
        }
    },

    /**
     * Set index directly
     */
    setIndex: async (index: number) => {
        const { progress, cardOrder } = get();
        if (!progress || index < 0 || index >= cardOrder.length) return;
        
        progress.setIndex(index);
        await container.saveFlashcardsProgress.execute(progress);
        set({ progress });
    },
}));
