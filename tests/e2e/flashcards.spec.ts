import { test, expect } from '@playwright/test';

/**
 * Flashcards E2E Tests
 * 
 * Tests according to test plan in study-flashcards.md
 * T-FC-01 to T-FC-15
 * 
 * Updated to use stable data-testid selectors
 */

// Helper to create a test set with cards
async function createTestSet(page: any, title: string, cards: Array<{ term: string; definition: string }>) {
  // Use localStorage injection to create set reliably
  await page.goto('/');

  const setId = await page.evaluate(({ title, cards }: any) => {
    const newSetId = 'test-set-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    const newSet = {
      id: newSetId,
      title,
      description: 'Created via E2E test injection',
      cards: cards.map((c: any, i: number) => ({
        id: `card-${Date.now()}-${i}`,
        ...c,
        position: i,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Get existing sets
    const setsJson = localStorage.getItem('quizlet_sets') || '[]';
    const sets = JSON.parse(setsJson);
    sets.push(newSet);
    localStorage.setItem('quizlet_sets', JSON.stringify(sets));

    return newSetId;
  }, { title, cards });

  return setId;
}

// Helper to create empty set via localStorage injection (UI blocks empty set creation)
async function createEmptySetForTest(page: any): Promise<string> {
  await page.goto('/');

  const emptySetId = await page.evaluate(() => {
    const setId = 'test-empty-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    const emptySet = {
      id: setId,
      title: 'Empty Test Set',
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Get existing sets from localStorage
    const setsJson = localStorage.getItem('quizlet_sets') || '[]';
    const sets = JSON.parse(setsJson);
    sets.push(emptySet);
    localStorage.setItem('quizlet_sets', JSON.stringify(sets));

    return setId;
  });

  return emptySetId;
}

test.describe('Flashcards Study Mode', () => {
  let setId: string | undefined;

  test.beforeEach(async ({ page }) => {
    // Create a test set with 3 cards
    setId = await createTestSet(page, 'Test Flashcards Set', [
      { term: 'Term 1', definition: 'Definition 1' },
      { term: 'Term 2', definition: 'Definition 2' },
      { term: 'Term 3', definition: 'Definition 3' },
    ]);
  });

  test('T-FC-01: Load happy path (canonical route)', async ({ page }) => {
    console.log('Running T-FC-01 with setId:', setId);
    if (!setId) throw new Error('setId is undefined');

    // Use canonical route /study/:setId/flashcards
    await page.goto(`/study/${setId}/flashcards`);

    // Wait for page to load using testid
    await page.waitForSelector('[data-testid="flashcard-progress"]');

    // Check progress indicator shows 1/3
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 1 of 3');

    // Check card shows term
    await expect(page.getByTestId('flashcard-term')).toHaveText('Term 1');
  });

  test('T-FC-02: Flip by click and Space', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('[data-testid="flashcard-term"]');

    // Click card to flip
    const card = page.getByTestId('flashcard-card');
    await card.click();

    // Should show definition
    await expect(page.getByTestId('flashcard-definition')).toBeVisible();
    await expect(page.getByTestId('flashcard-definition')).toHaveText('Definition 1');

    // Press Space to flip back
    await page.keyboard.press('Space');
    await page.waitForTimeout(200); // Small delay for flip animation

    // Should show term again
    await expect(page.getByTestId('flashcard-term')).toBeVisible();
    await expect(page.getByTestId('flashcard-term')).toHaveText('Term 1');
  });

  test('T-FC-03: Next/Prev bounds', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('[data-testid="flashcard-progress"]');

    // At first card: Prev should be disabled
    const prevButton = page.getByTestId('flashcard-prev');
    await expect(prevButton).toBeDisabled();

    // Navigate to last card
    const nextButton = page.getByTestId('flashcard-next');
    await nextButton.click();
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 2 of 3');

    await nextButton.click();
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 3 of 3');

    // At last card: Next should be disabled
    await expect(nextButton).toBeDisabled();

    // Navigate back to first
    await prevButton.click();
    await prevButton.click();
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 1 of 3');
  });

  test('T-FC-04: Mark Know and persist', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('[data-testid="flashcard-term"]');

    // Mark card 1 as Know
    const knowButton = page.getByTestId('flashcard-know');
    await knowButton.click();

    // Verify visual feedback - button should have success border/text class
    await expect(knowButton).toHaveClass(/border-success/);
    await expect(knowButton).toHaveClass(/text-success/);

    // Check known count updates
    const knownCount = page.getByTestId('flashcard-known-count');
    await expect(knownCount).toHaveText('1');

    // Wait for persistence
    await page.waitForTimeout(2000);

    // Refresh page
    await page.reload();
    await page.waitForSelector('[data-testid="flashcard-term"]');

    // Card 1 should still be marked Know
    await expect(page.getByTestId('flashcard-know')).toHaveClass(/border-success/);

    // Known count should still be 1
    await expect(page.getByTestId('flashcard-known-count')).toHaveText('1');
  });

  test('T-FC-05: Mark Still learning + overwrite', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('[data-testid="flashcard-term"]');

    // Mark as Know
    await page.getByTestId('flashcard-know').click();
    await expect(page.getByTestId('flashcard-known-count')).toHaveText('1');

    // Mark as Still learning (should overwrite)
    const learningButton = page.getByTestId('flashcard-learning');
    await learningButton.click();

    // Check status changed - learning button should have warning border
    await expect(learningButton).toHaveClass(/border-warning/);
    await expect(learningButton).toHaveClass(/text-warning/);

    // Counts should update - known should be 0, learning should be 1
    await expect(page.getByTestId('flashcard-known-count')).toHaveText('0');
    await expect(page.getByTestId('flashcard-learning-count')).toHaveText('1');
  });

  test('T-FC-06: Unset behavior', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('[data-testid="flashcard-term"]');

    // Mark as Know
    const knowButton = page.getByTestId('flashcard-know');
    await knowButton.click();
    await expect(knowButton).toHaveClass(/border-success/);

    // Click Know again to unset
    await knowButton.click();

    // Button should not have success border anymore
    const classes = await knowButton.getAttribute('class');
    expect(classes).not.toContain('border-success');

    // Known count should be 0
    await expect(page.getByTestId('flashcard-known-count')).toHaveText('0');
  });

  test('T-FC-07: Shuffle on/off', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('[data-testid="flashcard-term"]');

    // Toggle shuffle on
    const shuffleButton = page.getByTestId('flashcard-shuffle-toggle');
    await shuffleButton.click();

    // Index should reset to 1/3
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 1 of 3');

    // Button should show "Shuffled"
    await expect(shuffleButton).toHaveText(/Shuffled/);

    // Navigate a few cards
    await page.getByTestId('flashcard-next').click();
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 2 of 3');

    // Refresh page
    await page.reload();
    await page.waitForSelector('[data-testid="flashcard-shuffle-toggle"]');

    // Shuffle should still be ON
    await expect(page.getByTestId('flashcard-shuffle-toggle')).toHaveText(/Shuffled/);

    // Toggle shuffle off
    await page.getByTestId('flashcard-shuffle-toggle').click();

    // Should show "Shuffle" (not "Shuffled")
    await expect(page.getByTestId('flashcard-shuffle-toggle')).toHaveText(/^Shuffle$/);

    // Index should reset
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 1 of 3');
  });

  test('T-FC-08: Reset progress confirm', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('[data-testid="flashcard-term"]');

    // Mark a card as Know
    await page.getByTestId('flashcard-know').click();
    await expect(page.getByTestId('flashcard-known-count')).toHaveText('1');

    // Click reset
    await page.getByTestId('flashcard-reset').click();

    // Modal should appear
    await expect(page.getByTestId('flashcard-reset-modal')).toBeVisible();

    // Cancel - nothing changes
    await page.getByTestId('flashcard-reset-cancel').click();
    await expect(page.getByTestId('flashcard-known-count')).toHaveText('1');

    // Click reset again
    await page.getByTestId('flashcard-reset').click();
    await expect(page.getByTestId('flashcard-reset-modal')).toBeVisible();

    // Confirm reset
    await page.getByTestId('flashcard-reset-confirm').click();

    // Statuses should be cleared
    await expect(page.getByTestId('flashcard-known-count')).toHaveText('0');
    await expect(page.getByTestId('flashcard-learning-count')).toHaveText('0');

    // Index should reset
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 1 of 3');
  });

  test('T-FC-09: Empty set', async ({ page }) => {
    // Create empty set via localStorage injection
    const emptySetId = await createEmptySetForTest(page);

    await page.goto(`/study/${emptySetId}/flashcards`);

    // Should show empty state
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('empty-title')).toHaveText('No cards yet');
  });

  test('T-FC-10: Not found', async ({ page }) => {
    await page.goto('/study/invalid-id/flashcards');

    // Should show error state
    await expect(page.getByTestId('error-state')).toBeVisible();
    await expect(page.getByTestId('error-title')).toHaveText('Set not found');
  });

  test('T-FC-11: Keyboard shortcuts', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('[data-testid="flashcard-term"]');

    // K marks Know
    await page.keyboard.press('k');
    await expect(page.getByTestId('flashcard-know')).toHaveClass(/border-success/);
    await expect(page.getByTestId('flashcard-know')).toHaveClass(/text-success/);

    // L marks Learning
    await page.keyboard.press('l');
    await expect(page.getByTestId('flashcard-learning')).toHaveClass(/border-warning/);
    await expect(page.getByTestId('flashcard-learning')).toHaveClass(/text-warning/);

    // S toggles shuffle
    await page.keyboard.press('s');
    await expect(page.getByTestId('flashcard-shuffle-toggle')).toHaveText(/Shuffled/);

    // R opens reset modal
    await page.keyboard.press('r');
    await expect(page.getByTestId('flashcard-reset-modal')).toBeVisible();

    // Esc closes modal
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('flashcard-reset-modal')).not.toBeVisible();

    // ArrowRight navigates next
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 2 of 3');

    // ArrowLeft navigates prev
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 1 of 3');

    // Space flips card
    await page.keyboard.press('Space');
    await expect(page.getByTestId('flashcard-definition')).toBeVisible();
  });

  test('T-FC-12: Auto-advance after marking Know', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('[data-testid="flashcard-term"]');

    // Verify we're on card 1
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 1 of 3');

    // Mark card 1 as Know
    await page.getByTestId('flashcard-know').click();

    // Verify visual feedback immediately
    await expect(page.getByTestId('flashcard-know')).toHaveClass(/border-success/);

    // Wait for auto-advance (300ms + buffer)
    await page.waitForTimeout(500);

    // Should have advanced to card 2
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 2 of 3');
    await expect(page.getByTestId('flashcard-term')).toHaveText('Term 2');

    // Card 1 should still be marked Know (navigate back to verify)
    await page.getByTestId('flashcard-prev').click();
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 1 of 3');
    await expect(page.getByTestId('flashcard-know')).toHaveClass(/border-success/);
  });

  test('T-FC-13: Auto-advance after marking Still learning', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('[data-testid="flashcard-term"]');

    // Mark card 1 as Still learning
    await page.getByTestId('flashcard-learning').click();

    // Verify visual feedback immediately
    await expect(page.getByTestId('flashcard-learning')).toHaveClass(/border-warning/);

    // Wait for auto-advance
    await page.waitForTimeout(500);

    // Should have advanced to card 2
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 2 of 3');
  });

  test('T-FC-14: No auto-advance on last card', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('[data-testid="flashcard-term"]');

    // Navigate to last card
    await page.getByTestId('flashcard-next').click();
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 2 of 3');
    await page.getByTestId('flashcard-next').click();
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 3 of 3');

    // Verify Next button is disabled on last card
    await expect(page.getByTestId('flashcard-next')).toBeDisabled();

    // Mark last card as Know
    await page.getByTestId('flashcard-know').click();

    // Wait longer than auto-advance delay
    await page.waitForTimeout(500);

    // Should still be on card 3 (no advance)
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 3 of 3');
    await expect(page.getByTestId('flashcard-term')).toHaveText('Term 3');
  });

  test('T-FC-15: Backward compatibility - old route still works', async ({ page }) => {
    // Test that old route /sets/:id/study/flashcards still works
    await page.goto(`/sets/${setId}/study/flashcards`);
    await page.waitForSelector('[data-testid="flashcard-progress"]');

    // Should show same UI with testids
    await expect(page.getByTestId('flashcard-progress')).toHaveText('Card 1 of 3');
    await expect(page.getByTestId('flashcard-term')).toHaveText('Term 1');
  });
});
