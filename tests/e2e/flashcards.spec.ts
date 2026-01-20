import { test, expect } from '@playwright/test';

/**
 * Flashcards E2E Tests
 * 
 * Tests according to test plan in study-flashcards.md
 * T-FC-01 to T-FC-11
 */

// Helper to create a test set with cards
async function createTestSet(page: any, title: string, cards: Array<{ term: string; definition: string }>) {
  // Navigate to create set page
  await page.goto('/sets/new');
  
  // Fill in title
  await page.fill('input[type="text"]', title);
  
  // Add cards
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    
    // Click "Add card" if not first card
    if (i > 0) {
      await page.click('button:has-text("Add card")');
    }
    
    // Fill term and definition
    const termInputs = await page.locator('input[placeholder*="term" i], input[placeholder*="Term" i]').all();
    const defInputs = await page.locator('input[placeholder*="definition" i], input[placeholder*="Definition" i], textarea[placeholder*="definition" i]').all();
    
    if (termInputs.length > i) {
      await termInputs[i].fill(card.term);
    }
    if (defInputs.length > i) {
      await defInputs[i].fill(card.definition);
    }
  }
  
  // Save set
  await page.click('button:has-text("Save"), button:has-text("Create")');
  
  // Wait for navigation to set detail page
  await page.waitForURL(/\/sets\/[^/]+$/);
  
  // Get setId from URL
  const url = page.url();
  const setId = url.match(/\/sets\/([^/]+)$/)?.[1];
  return setId;
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
    // Use canonical route /study/:setId/flashcards
    await page.goto(`/study/${setId}/flashcards`);
    
    // Wait for page to load
    await page.waitForSelector('text=Card 1 of 3');
    
    // Check progress indicator shows 1/3
    await expect(page.locator('text=Card 1 of 3')).toBeVisible();
    
    // Check card shows term
    await expect(page.locator('text=Term 1')).toBeVisible();
  });

  test('T-FC-02: Flip by click and Space', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('text=Term 1');
    
    // Click card to flip
    const card = page.locator('[role="button"]:has-text("Term 1"), .cursor-pointer').first();
    await card.click();
    
    // Should show definition
    await expect(page.locator('text=Definition 1')).toBeVisible();
    
    // Press Space to flip back
    await page.keyboard.press('Space');
    
    // Should show term again
    await expect(page.locator('text=Term 1')).toBeVisible();
  });

  test('T-FC-03: Next/Prev bounds', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('text=Card 1 of 3');
    
    // At first card: Prev should be disabled
    const prevButton = page.locator('button:has-text("Previous")');
    await expect(prevButton).toBeDisabled();
    
    // Navigate to last card
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Card 2 of 3');
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Card 3 of 3');
    
    // At last card: Next should be disabled
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeDisabled();
    
    // ArrowLeft should not work at first card (no error)
    await page.click('button:has-text("Previous")');
    await page.click('button:has-text("Previous")');
    await expect(page.locator('text=Card 1 of 3')).toBeVisible();
  });

  test('T-FC-04: Mark Know and persist', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('text=Term 1');
    
    // Mark card 1 as Know
    await page.click('button:has-text("Know")');
    
    // Verify visual feedback
    await expect(page.locator('button:has-text("Know")')).toHaveClass(/border-success|bg-success/);
    
    // Check known count updates (should show "1 Known")
    await expect(page.locator('text=/1 Known/')).toBeVisible();
    
    // Refresh page
    await page.reload();
    await page.waitForSelector('text=Term 1');
    
    // Card 1 should still be marked Know
    const knowButton = page.locator('button:has-text("Know")');
    await expect(knowButton).toHaveClass(/border-success|bg-success/);
    
    // Known count should be correct
    await expect(page.locator('text=/1 Known/')).toBeVisible();
  });

  test('T-FC-05: Mark Still learning + overwrite', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('text=Term 1');
    
    // Mark as Know
    await page.click('button:has-text("Know")');
    await expect(page.locator('text=/\\d+ Know/')).toBeVisible();
    
    // Mark as Still learning (should overwrite)
    await page.click('button:has-text("Still learning")');
    
    // Check status changed
    const learningButton = page.locator('button:has-text("Still learning")');
    await expect(learningButton).toHaveClass(/border-warning|bg-warning/);
    
    // Counts should update
    await expect(page.locator('text=/\\d+ Learning/')).toBeVisible();
  });

  test('T-FC-06: Unset behavior', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('text=Term 1');
    
    // Mark as Know
    await page.click('button:has-text("Know")');
    
    // Click Know again to unset
    await page.click('button:has-text("Know")');
    
    // Button should not be in selected state
    const knowButton = page.locator('button:has-text("Know")');
    const classes = await knowButton.getAttribute('class');
    expect(classes).not.toContain('border-success');
    
    // Counts should update (no Know count)
    const knownText = await page.locator('text=/\\d+ Know/');
    const count = await knownText.count();
    expect(count).toBe(0);
  });

  test('T-FC-07: Shuffle on/off', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('text=Term 1');
    
    // Toggle shuffle on
    await page.click('button:has-text("Shuffle")');
    
    // Index should reset to 0
    await expect(page.locator('text=Card 1 of 3')).toBeVisible();
    
    // Navigate a few cards
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Card 2 of 3');
    
    // Refresh page
    await page.reload();
    await page.waitForSelector('text=Card');
    
    // Shuffle should still be ON
    const shuffleButton = page.locator('button:has-text("Shuffled")');
    await expect(shuffleButton).toBeVisible();
    
    // Toggle shuffle off
    await page.click('button:has-text("Shuffled")');
    
    // Should restore original order (Term 1 should be visible)
    await expect(page.locator('text=Term 1')).toBeVisible();
  });

  test('T-FC-08: Reset progress confirm', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('text=Term 1');
    
    // Mark a card as Know
    await page.click('button:has-text("Know")');
    await expect(page.locator('text=/\\d+ Know/')).toBeVisible();
    
    // Click reset
    await page.click('button:has-text("Reset")');
    
    // Modal should appear
    await expect(page.locator('text=Reset progress?')).toBeVisible();
    
    // Cancel - nothing changes
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=/\\d+ Know/')).toBeVisible();
    
    // Click reset again
    await page.click('button:has-text("Reset")');
    await expect(page.locator('text=Reset progress?')).toBeVisible();
    
    // Confirm reset
    await page.click('button:has-text("Reset"):not(:has-text("progress"))');
    
    // Statuses should be cleared
    const knownText = await page.locator('text=/\\d+ Know/');
    const count = await knownText.count();
    expect(count).toBe(0);
    
    // Index should reset
    await expect(page.locator('text=Card 1 of 3')).toBeVisible();
  });

  test('T-FC-09: Empty set', async ({ page }) => {
    // Create empty set
    const emptySetId = await createTestSet(page, 'Empty Set', []);
    
    await page.goto(`/study/${emptySetId}/flashcards`);
    
    // Should show empty state
    await expect(page.locator('text=No cards yet')).toBeVisible();
    await expect(page.locator('text=Add cards')).toBeVisible();
  });

  test('T-FC-10: Not found', async ({ page }) => {
    await page.goto('/study/invalid-id/flashcards');
    
    // Should show not found
    await expect(page.locator('text=Set not found')).toBeVisible();
    await expect(page.locator('text=Back to Set')).toBeVisible();
  });

  test('T-FC-11: Keyboard shortcuts', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('text=Term 1');
    
    // K marks Know
    await page.keyboard.press('K');
    await expect(page.locator('button:has-text("Know")')).toHaveClass(/border-success|bg-success/);
    
    // L marks Learning
    await page.keyboard.press('L');
    await expect(page.locator('button:has-text("Still learning")')).toHaveClass(/border-warning|bg-warning/);
    
    // S toggles shuffle
    await page.keyboard.press('S');
    await expect(page.locator('button:has-text("Shuffled")')).toBeVisible();
    
    // R opens reset modal
    await page.keyboard.press('R');
    await expect(page.locator('text=Reset progress?')).toBeVisible();
    
    // Esc closes modal
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Reset progress?')).not.toBeVisible();
    
    // ArrowRight navigates next
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('text=Card 2 of 3')).toBeVisible();
    
    // ArrowLeft navigates prev
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('text=Card 1 of 3')).toBeVisible();
    
    // Space flips card
    await page.keyboard.press('Space');
    await expect(page.locator('text=Definition 1')).toBeVisible();
  });

  test('T-FC-12: Auto-advance after marking Know', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('text=Term 1');
    
    // Verify we're on card 1
    await expect(page.locator('text=Card 1 of 3')).toBeVisible();
    
    // Mark card 1 as Know
    await page.click('button:has-text("Know")');
    
    // Verify visual feedback immediately
    await expect(page.locator('button:has-text("Know")')).toHaveClass(/border-success|bg-success/);
    
    // Wait for auto-advance (300ms + some buffer)
    await page.waitForTimeout(500);
    
    // Should have advanced to card 2
    await expect(page.locator('text=Card 2 of 3')).toBeVisible();
    await expect(page.locator('text=Term 2')).toBeVisible();
    
    // Card 1 should still be marked Know (persisted)
    // Navigate back to verify
    await page.click('button:has-text("Previous")');
    await expect(page.locator('text=Card 1 of 3')).toBeVisible();
    await expect(page.locator('button:has-text("Know")')).toHaveClass(/border-success|bg-success/);
  });

  test('T-FC-13: Auto-advance after marking Still learning', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('text=Term 1');
    
    // Mark card 1 as Still learning
    await page.click('button:has-text("Still learning")');
    
    // Verify visual feedback immediately
    await expect(page.locator('button:has-text("Still learning")')).toHaveClass(/border-warning|bg-warning/);
    
    // Wait for auto-advance
    await page.waitForTimeout(500);
    
    // Should have advanced to card 2
    await expect(page.locator('text=Card 2 of 3')).toBeVisible();
  });

  test('T-FC-14: No auto-advance on last card', async ({ page }) => {
    await page.goto(`/study/${setId}/flashcards`);
    await page.waitForSelector('text=Term 1');
    
    // Navigate to last card
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Card 2 of 3');
    await page.click('button:has-text("Next")');
    await page.waitForSelector('text=Card 3 of 3');
    
    // Verify Next button is disabled on last card
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeDisabled();
    
    // Mark last card as Know
    await page.click('button:has-text("Know")');
    
    // Wait longer than auto-advance delay
    await page.waitForTimeout(500);
    
    // Should still be on card 3 (no advance)
    await expect(page.locator('text=Card 3 of 3')).toBeVisible();
    await expect(page.locator('text=Term 3')).toBeVisible();
  });

  test('T-FC-15: Backward compatibility - old route still works', async ({ page }) => {
    // Test that old route /sets/:id/study/flashcards still works
    await page.goto(`/sets/${setId}/study/flashcards`);
    await page.waitForSelector('text=Card 1 of 3');
    await expect(page.locator('text=Term 1')).toBeVisible();
  });
});
