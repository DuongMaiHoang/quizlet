import { test, expect } from '@playwright/test';

/**
 * Learn Mode Regression Tests (MCQ + Adaptive)
 * Phase 2 F
 * Updated with correct selectors from source analysis.
 */

async function createLearnSet(page: any, title: string, cards: any[]) {
    await page.goto('/');
    return await page.evaluate(({ title, cards }: any) => {
        const newSetId = 'learn-set-' + Date.now();
        const newSet = {
            id: newSetId,
            title,
            description: 'E2E Learn Set',
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

test.describe('Learn Mode Regression', () => {
    let setId: string;

    test.beforeEach(async ({ page }) => {
        // Create set with 4 cards for adaptive scenarios
        setId = await createLearnSet(page, 'Learn Algo Set', [
            { term: 'A1', definition: 'D1-Correct' },
            { term: 'A2', definition: 'D2-Correct' },
            { term: 'A3', definition: 'D3-Correct' },
            { term: 'A4', definition: 'D4-Correct' }
        ]);
    });

    test('F1-F4: Entry, UI, Feedback, Progress', async ({ page }) => {
        await page.goto(`/study/${setId}/learn`);

        // F1. Entry & UI
        await expect(page.getByTestId('learn-progress-banner')).toBeVisible();
        await expect(page.getByTestId('learn-progress-label')).toHaveText(/Tiến độ học/i);
        await expect(page.getByTestId('learn-option-1')).toBeVisible();
        await expect(page.getByTestId('learn-option-4')).toBeVisible();

        // F2. Correct Answer
        // Logic: options are shuffled. We need to find the button with Definition D*-Correct matching the Term.
        // But we don't know which term is shown easily without reading "learn-prompt".
        // Let's just click the correct answer based on UI matching.

        const prompt = await page.getByTestId('learn-prompt').textContent();
        // Map A1 -> D1-Correct
        const correctDef = prompt?.replace('A', 'D') + '-Correct';

        // Find button with this text
        await page.getByRole('button', { name: correctDef }).click();

        // Feedback "Đúng rồi"
        await expect(page.getByTestId('learn-feedback')).toBeVisible();
        await expect(page.locator('.text-success')).toHaveText(/Đúng rồi/i);
        await expect(page.getByTestId('learn-continue')).toBeVisible();

        // Continue
        await page.getByTestId('learn-continue').click();

        // F3. Skip
        await page.getByTestId('learn-skip').click();

        // Check progress
        // 1 correct (25%)
        await expect(page.getByTestId('learn-progress-percent')).toHaveText('25%');
    });

    test('F5: Adaptive Retry Logic', async ({ page }) => {
        // Scenario: 2 Correct, 2 Wrong/Skipped
        await page.goto(`/study/${setId}/learn`);

        // Loop 4 times
        for (let i = 0; i < 4; i++) {
            if (i < 2) {
                // Correct
                const prompt = await page.getByTestId('learn-prompt').textContent();
                const correctDef = prompt?.replace('A', 'D') + '-Correct';
                await page.getByRole('button', { name: correctDef }).click();
                await page.getByTestId('learn-continue').click();
            } else {
                // Skip
                await page.getByTestId('learn-skip').click();
            }
        }

        // Completion Screen check
        // Variant A: "Chưa xong đâu"
        await expect(page.getByText(/Chưa xong đâu/i)).toBeVisible();

        // Check retry button text "Học lại các câu sai (2)"
        const retryBtn = page.getByTestId('learn-retry-wrong');
        await expect(retryBtn).toBeVisible();
        // Regex checking for (2)
        await expect(retryBtn).toContainText('(2)');

        // Click Retry
        await retryBtn.click();

        // Verify Session is now size 2 (check 2 steps)
        await expect(page.getByTestId('learn-prompt')).toBeVisible();
        await page.getByTestId('learn-skip').click(); // 1
        await expect(page.getByTestId('learn-prompt')).toBeVisible();
        await page.getByTestId('learn-skip').click(); // 2

        // Should see completion again
        await expect(page.getByText(/Chưa xong đâu/i)).toBeVisible();
    });

    test('F6-F7: Sticky Correct & Explicit Reset', async ({ page }) => {
        await page.goto(`/study/${setId}/learn`);

        // Answer 1 Correct
        const prompt = await page.getByTestId('learn-prompt').innerText();
        const correctDef = prompt.replace('A', 'D') + '-Correct';
        await page.getByRole('button', { name: correctDef }).click();
        await page.getByTestId('learn-continue').click();

        // Progress 25%
        await expect(page.getByTestId('learn-progress-percent')).toHaveText('25%');

        // Refresh
        await page.reload();
        await expect(page.getByTestId('learn-progress-percent')).toHaveText('25%'); // F8 Persistence

        // Finish session to get to reset
        // Skip remaining 3
        await page.getByTestId('learn-skip').click();
        await page.getByTestId('learn-skip').click();
        await page.getByTestId('learn-skip').click();

        // Variant A -> Click Retry
        await page.getByTestId('learn-retry-wrong').click();

        // Answer remaining 3 correctly in Retry session
        for (let i = 0; i < 3; i++) {
            const p = await page.getByTestId('learn-prompt').innerText();
            const ans = p.replace('A', 'D') + '-Correct';
            await page.getByRole('button', { name: ans }).click();
            await page.getByTestId('learn-continue').click();
        }

        // Now all 4 master -> Variant B "Hoàn thành"
        await expect(page.getByText(/Hoàn thành/i)).toBeVisible();
        await expect(page.getByTestId('learn-progress-percent')).toHaveText('100%');

        // Reset from Scratch
        const resetBtn = page.getByTestId('learn-restart-from-scratch');
        await expect(resetBtn).toBeVisible();
        await resetBtn.click();

        // Should be back to start
        await expect(page.getByTestId('learn-prompt')).toBeVisible();
        await expect(page.getByTestId('learn-progress-percent')).toHaveText('0%');
    });

});
