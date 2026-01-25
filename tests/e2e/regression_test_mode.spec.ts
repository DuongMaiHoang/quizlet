import { test, expect } from '@playwright/test';

/**
 * Test Mode Regression Tests (Phase 2 G)
 * Covers: Entry, Written Answer, MCQ Mix, Completion
 * Updated with specific selectors matching TestPage.tsx
 */

async function createTestSet(page: any, title: string, cards: any[]) {
    await page.goto('/');
    return await page.evaluate(({ title, cards }: any) => {
        const newSetId = 'test-mode-set-' + Date.now();
        const newSet = {
            id: newSetId,
            title,
            description: 'E2E Test Mode Set',
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
        const sets = JSON.parse(localStorage.getItem('quizlet_sets') || '[]');
        sets.push(newSet);
        localStorage.setItem('quizlet_sets', JSON.stringify(sets));
        return newSetId;
    }, { title, cards });
}

test.describe('Test Mode Regression', () => {
    let setId: string;

    test.beforeEach(async ({ page }) => {
        // Test mode requires minimum 3 cards
        setId = await createTestSet(page, 'Test Mode Set', [
            { term: 'T1', definition: 'D1' },
            { term: 'T2', definition: 'D2' },
            { term: 'T3', definition: 'D3' },
            { term: 'T4', definition: 'D4' }
        ]);
    });

    test('G1-G3: Entry, Interaction, Completion', async ({ page }) => {
        // Entry point: /sets/[id] -> "Test" button
        await page.goto(`/sets/${setId}`);

        // Find Test button (might be "Test" or "Study Mode")
        const testBtn = page.locator('a, button').filter({ hasText: /Test/i }).first();
        await testBtn.click();

        // G1. Entry & Runner
        // Should see "Question 1 of 4"
        await expect(page.getByText(/Question \d+ of 4/i)).toBeVisible();

        for (let i = 0; i < 4; i++) {
            // Detect type by input presence
            const writtenInput = page.locator('input#answer');
            const isWritten = await writtenInput.count() > 0;

            // Get Question Text - in h1 or large text container
            const questionText = await page.locator('.text-2xl.font-bold').innerText();

            // Find matching definition
            let answer = '';
            if (questionText.includes('T1')) answer = 'D1';
            else if (questionText.includes('T2')) answer = 'D2';
            else if (questionText.includes('T3')) answer = 'D3';
            else if (questionText.includes('T4')) answer = 'D4';

            if (!answer) throw new Error(`Could not identify term in question: ${questionText}`);

            if (isWritten) {
                // G2. Written Answer
                await writtenInput.fill(answer);

                // Next button
                const nextBtn = page.locator('button').filter({ hasText: /Next Question|Finish Test/ }).first();
                await nextBtn.click();
            } else {
                // MCQ
                // Choices are buttons with text inside span
                // Click option with exact text match of answer
                const choiceBtn = page.locator('button').filter({ hasText: answer }).last();
                await choiceBtn.click();

                // Wait for selection visual feedback (border-primary or similar)
                // But we can just click Next immediately usually?
                // TestPage.tsx logic: setSelectedChoice -> renders selected state.
                // Then click Next manually.

                const nextBtn = page.locator('button').filter({ hasText: /Next Question|Finish Test/ }).first();
                await expect(nextBtn).toBeEnabled();
                await nextBtn.click();
            }

            // Wait for next question or completion transition
            // We can wait for question index change OR completion header
            await page.waitForTimeout(300);
        }

        // G3. Completion
        // "Test Complete!"
        await expect(page.getByText(/Test Complete!/i)).toBeVisible();
        await expect(page.getByText(/100%/)).toBeVisible(); // Score

        // Review answers section
        await expect(page.getByText(/Review Your Answers/i)).toBeVisible();

        // Back to set
        await page.getByRole('button', { name: /Back to set/i }).first().click();
        await expect(page).toHaveURL(new RegExp(`/sets/${setId}`));
    });

});
