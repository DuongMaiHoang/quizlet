
import { test, expect } from '@playwright/test';
import path from 'path';

const artifactDir = 'C:/Users/PC/.gemini/antigravity/brain/364ddd13-6016-4503-a376-ca1b65c469fd';

test('Capture MC Final Success', async ({ page }) => {
    test.setTimeout(60000);
    console.log('--- TEST START ---');

    // Use 127.0.0.1 because debug test confirmed it works
    await page.goto('http://127.0.0.1:3000/create-set');
    console.log('Navigated to Create Set');

    // Wait for ANY input to be sure page is rendered
    await page.waitForSelector('input', { timeout: 15000 });

    // Open Import Modal
    console.log('Clicking Import Overlay trigger...');
    await page.locator('button').filter({ hasText: /^Import$/ }).first().click().catch(() => {
        return page.getByRole('button', { name: /import/i }).first().click();
    });

    await page.waitForSelector('textarea', { timeout: 15000 });
    console.log('Import Modal Open');

    // Paste Data
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
    await page.waitForTimeout(1000);
    console.log('Data pasted');

    // Screenshot 1: Data typed
    await page.screenshot({ path: path.join(artifactDir, 'import_mc_step1_typed.png') });
    console.log('Saved import_mc_step1_typed.png');

    // Change separators
    console.log('Changing card separator to Custom ===');
    try {
        // Find the card separator group (the one with SEMICOLON as an option)
        await page.getByLabel('Custom').last().click();
        await page.waitForTimeout(500);
        await page.getByPlaceholder('e.g. ::').fill('===');
        await page.waitForTimeout(2000); // Debounce + Preview

        // Screenshot 2: Configuration and Preview
        await page.screenshot({ path: path.join(artifactDir, 'import_mc_step2_preview.png') });
        console.log('Saved import_mc_step2_preview.png');
    } catch (e) {
        console.error('Failed to configure separators:', e);
    }

    // Finalize
    console.log('Clicking Final Import button...');
    try {
        await page.locator('button').filter({ hasText: /^Import [0-9]+ questions$/ }).first().click().catch(() => {
            return page.locator('button:has-text("Import")').last().click();
        });
        await page.waitForTimeout(1000);

        // Screenshot 3: Result in Set Form
        await page.screenshot({ path: path.join(artifactDir, 'import_mc_step3_result.png'), fullPage: true });
        console.log('Saved import_mc_step3_result.png');
    } catch (e) {
        console.error('Failed to finalize import:', e);
    }

    console.log('--- TEST END ---');
});
