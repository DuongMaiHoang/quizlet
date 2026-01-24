
import { test, expect } from '@playwright/test';
import path from 'path';

// Artifact directory
const artifactDir = 'C:/Users/PC/.gemini/antigravity/brain/364ddd13-6016-4503-a376-ca1b65c469fd';

test('Capture MC Import Guide', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Go to Create Set
    await page.goto('/create-set').catch(async () => {
        await page.goto('/');
        await page.getByRole('link', { name: /create/i }).first().click();
    });

    // Wait for title input
    await page.waitForSelector('input[placeholder*="title"], input[placeholder*="Title"]');

    // Fill basics
    await page.getByPlaceholder(/enter title/i).first().fill('Ôn tập Trắc nghiệm');

    // 2. Open Import
    await page.getByRole('button', { name: /import/i }).click();

    // Wait for Import Modal
    await page.waitForSelector('textarea');
    await page.waitForTimeout(500); // Visual stability

    // 3. Configure Separators
    // Use robust locator for the "Between Cards" Custom option
    const cardSepRadios = page.locator('input[name="cardSep"]');
    // Expecting 3 radios: Newline, Semicolon, Custom. nth(2) is Custom
    await cardSepRadios.nth(2).click();

    // Type '===' into the input that appears next to it
    await page.getByPlaceholder('e.g. ::').fill('===');

    // 4. Paste Data (Question with Newlines + Options)
    const importData = `Thủ đô của Việt Nam là gì?
A. Hà Nội
B. Hồ Chí Minh
C. Đà Nẵng
D. Cần Thơ\tA. Hà Nội
===
2 + 2 = ?
A. 3
B. 4
C. 5
D. 6\tB. 4`;

    await page.locator('textarea').fill(importData);

    // Wait for preview to stabilize (debounce is 200ms)
    await page.waitForTimeout(2000);

    // Take Screenshot of Import Overlay
    await page.screenshot({ path: path.join(artifactDir, '2_import_mc_overlay.png') });

    // 5. Complete Import
    await page.getByRole('button', { name: /import/i }).last().click();

    // Wait for form to populate (check for "Thủ đô" in inputs)
    await page.getByText('Thủ đô của Việt Nam').first().waitFor();
    await page.waitForTimeout(500);

    // Screenshot Filled Form
    await page.screenshot({ path: path.join(artifactDir, '3_create_set_mc_filled.png'), fullPage: true });

    // 6. Create Set
    await page.getByRole('button', { name: /create/i }).last().click();

    // Wait for redirect to Study page (check URL contains /study/ or /sets/)
    await page.waitForURL(/\/study\/|\/sets\//);

    // Navigate to Flashcards if not already
    const url = page.url();
    const idMatch = url.match(/(?:sets|study)\/([^\/]+)/);
    if (idMatch) {
        await page.goto(`/study/${idMatch[1]}/flashcards`);
    }

    // 7. Flashcard View
    await page.waitForSelector('[data-testid="flashcard-term"]');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(artifactDir, '4_mc_flashcard_front.png') });

    // 8. Flip
    await page.getByTestId('flashcard-card').click();
    await page.waitForSelector('[data-testid="flashcard-definition"]');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(artifactDir, '5_mc_flashcard_back.png') });
});
