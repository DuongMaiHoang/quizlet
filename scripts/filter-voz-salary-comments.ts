import fs from 'fs';
import path from 'path';

function isSalaryRelatedBlock(lines: string[]): boolean {
  const text = lines.join(' ').toLowerCase();

  const strongKeywords = [
    'lương',
    'luong',
    'gross',
    'net ',
    'net:',
    'offer',
    'mức lương',
    'luong thang',
    'lương tháng',
    'lương năm',
    'luong nam',
    'deal lương',
    'salary',
  ];

  if (strongKeywords.some((kw) => text.includes(kw))) {
    return true;
  }

  const moneyPattern =
    /\b\d+(\.\d+)?\s*(tr|triệu|trieu|k|củ|cu|usd|eur|aud|cad|vnd)\b/i;
  if (moneyPattern.test(text)) {
    return true;
  }

  const rangePattern = /\b\d+\s*-\s*\d+\s*(tr|triệu|trieu|k|củ|cu)\b/i;
  if (rangePattern.test(text)) {
    return true;
  }

  const dollarPattern = /\b\d+(\.\d+)?\s*\$/;
  if (dollarPattern.test(text)) {
    return true;
  }

  return false;
}

function filterCommentsFile(filePath: string) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`❌ Không tìm thấy file: ${absPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(absPath, 'utf8');
  const lines = raw.split(/\r?\n/);

  const headerLines: string[] = [];
  const blocks: string[][] = [];

  let idx = 0;

  while (idx < lines.length && !lines[idx].startsWith('**[')) {
    headerLines.push(lines[idx]);
    idx++;
  }

  let currentBlock: string[] | null = null;

  for (; idx < lines.length; idx++) {
    const line = lines[idx];

    if (line.startsWith('**[')) {
      if (currentBlock && currentBlock.length > 0) {
        blocks.push(currentBlock);
      }
      currentBlock = [line];
    } else {
      if (!currentBlock) {
        headerLines.push(line);
      } else {
        currentBlock.push(line);
      }
    }
  }

  if (currentBlock && currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  const keptBlocks: string[][] = [];
  let keptCount = 0;

  for (const block of blocks) {
    if (isSalaryRelatedBlock(block)) {
      keptBlocks.push(block);
      keptCount++;
    }
  }

  const outputLines: string[] = [];
  outputLines.push(...headerLines);

  if (keptBlocks.length > 0) {
    if (
      outputLines.length === 0 ||
      outputLines[outputLines.length - 1].trim() !== ''
    ) {
      outputLines.push('');
    }

    keptBlocks.forEach((block, i) => {
      if (i > 0) {
        if (outputLines[outputLines.length - 1].trim() !== '') {
          outputLines.push('');
        }
      }
      outputLines.push(...block);
    });
  }

  fs.writeFileSync(absPath, outputLines.join('\n'), 'utf8');

  console.log(`✅ Đã lọc xong file: ${absPath}`);
  console.log(`   Tổng block: ${blocks.length}`);
  console.log(`   Giữ lại (liên quan lương): ${keptCount}`);
}

if (require.main === module) {
  const argPath = process.argv[2];
  if (!argPath) {
    console.error(
      'Cách dùng: npx tsx scripts/filter-voz-salary-comments.ts <path-to-comments.md>',
    );
    process.exit(1);
  }

  filterCommentsFile(argPath);
}

import fs from 'fs';
import path from 'path';

/**
 * Lọc các comment trong comments.md, chỉ giữ lại những block có nhắc tới lương / mức thu nhập.
 *
 * Quy ước format hiện tại:
 * - Header ở đầu file (tiêu đề, tổng số comment, ---)
 * - Mỗi comment gốc bắt đầu bằng dòng: **[N]**
 * - Reply là các dòng bắt đầu bằng khoảng trắng + '>'
 *
 * Chiến lược:
 * - Giữ nguyên phần header (mọi dòng trước comment gốc đầu tiên).
 * - Xem mỗi block từ **[N]** tới ngay trước **[N]** tiếp theo là một "comment block".
 * - Chỉ giữ lại những block thỏa điều kiện "liên quan lương".
 */

function isSalaryRelatedBlock(lines: string[]): boolean {
  const text = lines.join(' ').toLowerCase();

  // Từ khóa chắc chắn liên quan lương
  const strongKeywords = [
    'lương',
    'luong',
    'gross',
    'net ',
    'net:',
    'offer',
    'mức lương',
    'luong thang',
    'lương tháng',
    'lương năm',
    'luong nam',
    'deal lương',
    'salary',
  ];

  if (strongKeywords.some((kw) => text.includes(kw))) {
    return true;
  }

  // Pattern số + đơn vị tiền (tr, triệu, k, củ, usd, $...)
  const moneyPattern =
    /\b\d+(\.\d+)?\s*(tr|triệu|trieu|k|củ|cu|usd|eur|aud|cad|vnd)\b/i;
  if (moneyPattern.test(text)) {
    return true;
  }

  // Một số câu kiểu "tháng 15-20 củ", "10-15tr"
  const rangePattern = /\b\d+\s*-\s*\d+\s*(tr|triệu|trieu|k|củ|cu)\b/i;
  if (rangePattern.test(text)) {
    return true;
  }

  // Có ký hiệu $ + số (ví dụ 600$)
  const dollarPattern = /\b\d+(\.\d+)?\s*\$/;
  if (dollarPattern.test(text)) {
    return true;
  }

  return false;
}

function filterCommentsFile(filePath: string) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`❌ Không tìm thấy file: ${absPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(absPath, 'utf8');
  const lines = raw.split(/\r?\n/);

  const headerLines: string[] = [];
  const blocks: string[][] = [];

  let idx = 0;

  // Lấy header: mọi dòng trước comment gốc đầu tiên (**[N]**)
  while (idx < lines.length && !lines[idx].startsWith('**[')) {
    headerLines.push(lines[idx]);
    idx++;
  }

  let currentBlock: string[] | null = null;

  for (; idx < lines.length; idx++) {
    const line = lines[idx];

    if (line.startsWith('**[')) {
      // Bắt đầu block mới
      if (currentBlock && currentBlock.length > 0) {
        blocks.push(currentBlock);
      }
      currentBlock = [line];
    } else {
      if (!currentBlock) {
        // Trường hợp hiếm: dòng lẻ trước khi gặp **[N]**, coi như thuộc header
        headerLines.push(line);
      } else {
        currentBlock.push(line);
      }
    }
  }

  if (currentBlock && currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  const keptBlocks: string[][] = [];
  let keptCount = 0;

  for (const block of blocks) {
    if (isSalaryRelatedBlock(block)) {
      keptBlocks.push(block);
      keptCount++;
    }
  }

  const outputLines: string[] = [];
  outputLines.push(...headerLines);

  if (keptBlocks.length > 0) {
    // Đảm bảo có một dòng trống giữa header và block đầu tiên (nếu chưa có)
    if (outputLines.length === 0 || outputLines[outputLines.length - 1].trim() !== '') {
      outputLines.push('');
    }

    keptBlocks.forEach((block, i) => {
      if (i > 0) {
        // Ngăn cách các block bằng một dòng trống
        if (outputLines[outputLines.length - 1].trim() !== '') {
          outputLines.push('');
        }
      }
      outputLines.push(...block);
    });
  }

  fs.writeFileSync(absPath, outputLines.join('\n'), 'utf8');

  console.log(`✅ Đã lọc xong file: ${absPath}`);
  console.log(`   Tổng block: ${blocks.length}`);
  console.log(`   Giữ lại (liên quan lương): ${keptCount}`);
}

if (require.main === module) {
  const argPath = process.argv[2];
  if (!argPath) {
    console.error(
      'Cách dùng: npx tsx scripts/filter-voz-salary-comments.ts <path-to-comments.md>',
    );
    process.exit(1);
  }

  filterCommentsFile(argPath);
}


