
import { test, expect } from '@playwright/test';
import path from 'path';

const artifactDir = 'C:/Users/PC/.gemini/antigravity/brain/364ddd13-6016-4503-a376-ca1b65c469fd';

test('Basic Debug Test Again', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000', { timeout: 10000 });
    await page.screenshot({ path: path.join(artifactDir, 'debug_home_reverify.png') });
});
