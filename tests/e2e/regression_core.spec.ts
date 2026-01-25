import { test, expect } from '@playwright/test';

/**
 * Core Features Regression Tests
 * Covers Phase 2 A-C: Home, Create/Edit, Bulk Import
 * Updated with generic selectors to bypass specific ID issues.
 */

test.describe('Core Features Regression', () => {

    test('A. Home Page & Search', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Quizlet/);

        // Check for "Library" or "Create"
        const createBtn = page.locator('a[href="/sets/new"], button:has-text("Create Set"), button:has-text("Tạo bộ thẻ")').first();
        await expect(createBtn).toBeVisible();

        // Search input
        const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Tìm kiếm"]').first();
        if (await searchInput.count() > 0) {
            await searchInput.fill('NonExistentSet12345');
            await searchInput.clear();
        }
    });

    test('B. Create Set Validation & Success', async ({ page }) => {
        await page.goto('/sets/new');

        // Validation - submit primary button
        // Find the "Create" button - usually primary bg color or specific text
        const submitBtn = page.locator('button[type="submit"]');
        await submitBtn.click();

        // Expect error message
        await expect(page.locator('.text-error, .bg-error\\/10')).toBeVisible();

        // Create success
        // Title input
        await page.locator('#title').fill('Regression Set B');

        // Add cards - target input inside card list
        // Assuming cards have input[placeholder="Enter term"]
        const termInputs = page.locator('input[placeholder*="Enter term"], input[placeholder*="Nhập thuật ngữ"]');
        const defInputs = page.locator('input[placeholder*="Enter definition"], input[placeholder*="Nhập định nghĩa"]');

        await expect(termInputs.first()).toBeVisible();

        await termInputs.nth(0).fill('Term 1');
        await defInputs.nth(0).fill('Def 1');
        await termInputs.nth(1).fill('Term 2');
        await defInputs.nth(1).fill('Def 2');

        await submitBtn.click();

        // Expect redirect
        await expect(page).toHaveURL(/\/sets\/.+/);
        await expect(page.locator('h1')).toContainText('Regression Set B');
    });

    test('C. Edit Set & Persistence', async ({ page }) => {
        await page.goto('/');

        const setId = await page.evaluate(() => {
            const id = 'edit-test-' + Date.now();
            const set = {
                id,
                title: 'Pre-Edit Title',
                cards: [
                    { id: 'c1', term: 'T1', definition: 'D1' }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const sets = JSON.parse(localStorage.getItem('quizlet_sets') || '[]');
            sets.push(set);
            localStorage.setItem('quizlet_sets', JSON.stringify(sets));
            return id;
        });

        await page.goto(`/sets/${setId}/edit`);

        // Verify pre-filled
        await expect(page.locator('input[value="Pre-Edit Title"]')).toBeVisible();

        // Modify
        await page.locator('#title').fill('Post-Edit Title');

        // Save
        const saveBtn = page.locator('button[type="submit"]');
        await saveBtn.click();

        // Verify detail page
        await expect(page).toHaveURL(/\/sets\/.+/);
        await expect(page.locator('h1')).toContainText('Post-Edit Title');

        // Persistence check
        await page.reload();
        await expect(page.locator('h1')).toContainText('Post-Edit Title');
    });

    test('C. Bulk Import', async ({ page }) => {
        await page.goto('/sets/new');

        // Open Import Modal
        const importBtn = page.locator('button').filter({ hasText: /Nhập nhanh hàng loạt|Import/i }).first();
        await importBtn.click();

        // TextArea
        const textarea = page.locator('textarea');
        await expect(textarea).toBeVisible();

        // Input
        await textarea.fill('Bulk T1 :: Bulk D1\\nBulk T2 :: Bulk D2');
        await page.waitForTimeout(1000);

        // Separator
        const sepLabel = page.locator('label').filter({ hasText: /::/ }).first();
        await sepLabel.click();

        // Verify Preview
        await expect(page.locator('text=Bulk T1')).toBeVisible();

        // Import
        const doImportBtn = page.locator('button').filter({ hasText: /Nhập \d+ thẻ|Import/i }).last();
        await doImportBtn.click();

        // Verify Set Form has inputs
        await expect(textarea).not.toBeVisible();
        await expect(page.locator('input[value="Bulk T1"]')).toBeVisible();
    });

});
