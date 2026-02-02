import { chromium } from 'playwright';
import * as fs from 'fs';

async function testCommentIds() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const baseUrl = 'https://voz.vn/t/xin-kinh-nghiem-phong-van-tymex.1032589';
    
    // Fetch page 4
    console.log('=== Fetching Page 4 ===');
    await page.goto(`${baseUrl}/page-4`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    const page4Comments = await page.locator('article.message--post').all();
    const page4Data: Array<{ id: string; content: string; parentId: string | null }> = [];
    
    for (const element of page4Comments) {
      const dataContent = await element.getAttribute('data-content') || '';
      const idMatch = dataContent.match(/post-(\d+)/);
      if (!idMatch) continue;
      
      const commentId = idMatch[1];
      const content = await element.locator('.bbWrapper').first().textContent() || '';
      
      // Check if reply
      const quoteLink = element.locator('a.bbCodeBlock-sourceJump').first();
      let parentId: string | null = null;
      if (await quoteLink.count() > 0) {
        const selector = await quoteLink.getAttribute('data-content-selector');
        if (selector) {
          const match = selector.match(/#post-(\d+)/);
          if (match) parentId = match[1];
        }
      }
      
      page4Data.push({
        id: commentId,
        content: content.substring(0, 100).trim(),
        parentId
      });
    }
    
    console.log(`Page 4: Found ${page4Data.length} comments`);
    console.log('Page 4 comment IDs:', page4Data.map(c => c.id).join(', '));
    console.log('Page 4 parent IDs:', page4Data.filter(c => c.parentId).map(c => c.parentId).join(', '));
    
    // Fetch page 5
    console.log('\n=== Fetching Page 5 ===');
    await page.goto(`${baseUrl}/page-5`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    
    const page5Comments = await page.locator('article.message--post').all();
    const page5Data: Array<{ id: string; content: string; parentId: string | null }> = [];
    
    for (const element of page5Comments) {
      const dataContent = await element.getAttribute('data-content') || '';
      const idMatch = dataContent.match(/post-(\d+)/);
      if (!idMatch) continue;
      
      const commentId = idMatch[1];
      const content = await element.locator('.bbWrapper').first().textContent() || '';
      
      // Check if reply
      const quoteLink = element.locator('a.bbCodeBlock-sourceJump').first();
      let parentId: string | null = null;
      if (await quoteLink.count() > 0) {
        const selector = await quoteLink.getAttribute('data-content-selector');
        if (selector) {
          const match = selector.match(/#post-(\d+)/);
          if (match) parentId = match[1];
        }
      }
      
      page5Data.push({
        id: commentId,
        content: content.substring(0, 100).trim(),
        parentId
      });
    }
    
    console.log(`Page 5: Found ${page5Data.length} comments`);
    console.log('Page 5 comment IDs:', page5Data.map(c => c.id).join(', '));
    console.log('Page 5 parent IDs:', page5Data.filter(c => c.parentId).map(c => c.parentId).join(', '));
    
    // So sánh
    console.log('\n=== Comparison ===');
    const page4Ids = new Set(page4Data.map(c => c.id));
    const page5Ids = new Set(page5Data.map(c => c.id));
    
    // Tìm comment IDs trùng nhau
    const duplicateIds = [...page4Ids].filter(id => page5Ids.has(id));
    if (duplicateIds.length > 0) {
      console.log(`⚠️  WARNING: Found ${duplicateIds.length} duplicate comment IDs:`, duplicateIds);
      console.log('This means the same comment appears on both pages!');
    } else {
      console.log('✅ No duplicate IDs - each comment appears on only one page');
    }
    
    // Kiểm tra: comment ở page 5 có reply comment từ page 4 không?
    const page4IdsSet = new Set(page4Data.map(c => c.id));
    const page5RepliesToPage4 = page5Data.filter(c => c.parentId && page4IdsSet.has(c.parentId));
    
    if (page5RepliesToPage4.length > 0) {
      console.log(`\n✅ Found ${page5RepliesToPage4.length} comments on page 5 that reply to comments from page 4:`);
      for (const reply of page5RepliesToPage4) {
        const parent = page4Data.find(c => c.id === reply.parentId);
        console.log(`  - Comment ${reply.id} replies to comment ${reply.parentId} (from page 4)`);
        console.log(`    Parent content: ${parent?.content.substring(0, 50)}...`);
        console.log(`    Reply content: ${reply.content.substring(0, 50)}...`);
      }
    } else {
      console.log('\nℹ️  No comments on page 5 reply to comments from page 4');
    }
    
    // Lưu kết quả
    const result = {
      page4: {
        total: page4Data.length,
        ids: page4Data.map(c => c.id),
        parentIds: page4Data.filter(c => c.parentId).map(c => c.parentId)
      },
      page5: {
        total: page5Data.length,
        ids: page5Data.map(c => c.id),
        parentIds: page5Data.filter(c => c.parentId).map(c => c.parentId)
      },
      duplicates: duplicateIds,
      page5RepliesToPage4: page5RepliesToPage4.map(r => ({
        id: r.id,
        parentId: r.parentId
      }))
    };
    
    fs.writeFileSync('comment-ids-comparison.json', JSON.stringify(result, null, 2), 'utf-8');
    console.log('\n✅ Results saved to comment-ids-comparison.json');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testCommentIds().catch(console.error);

