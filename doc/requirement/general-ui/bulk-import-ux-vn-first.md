# Bulk Import UX (VN-first) — Requirement Add-on

**Scope**: Improve “Import cards from text” experience for Vietnamese students (non-technical).  
**Goal**: Students can paste content from Word/Google Docs/Zalo/Facebook and quickly create correct cards with low friction.

## 1) Key UX Principles
- **Safe-by-default**: Always show preview before creating cards.
- **Forgiving input**: Tolerate messy whitespace, punctuation, Vietnamese diacritics.
- **Teach by example**: Provide examples in Vietnamese; avoid technical jargon like “delimiter”.
- **Never lose user work**: Draft is autosaved locally.

---

## 2) Entry Points (must feel natural)
### EP-01: From Create/Edit Set
- On Create/Edit Set page, show button:
  - UI copy: `"Nhập nhanh hàng loạt"`
- Clicking opens Import Drawer/Modal (recommended modal on desktop, full-screen sheet on mobile).

### EP-02: From empty state
- If set has 0 cards, show CTA:
  - UI copy: `"Dán nội dung để tạo thẻ"`

---

## 3) Import Screen Layout
### 3.1 Left: Input
- Title: `"Dán nội dung"`
- Textarea placeholder (Vietnamese example):
  - `"Ví dụ:\nTừ 1\tNghĩa 1\nTừ 2\tNghĩa 2\n\nHoặc:\nCâu hỏi 1 :: Trả lời 1\nCâu hỏi 2 :: Trả lời 2"`

### 3.2 Right: Parsing Settings + Preview
**A) Mode selector**
- Label: `"Chọn kiểu tách"`
- Options:
  1. `"Mặc định: Tab (khuyên dùng)"`  (term<tab>definition per line)
  2. `"Mặc định: Dấu :: "`            (term :: definition)
  3. `"Tùy chỉnh"`                    (user choose separators)

**B) For Custom mode**
- Field 1: `"Ký tự tách Câu hỏi - Trả lời"`
- Field 2: `"Ký tự tách giữa các thẻ"`
- Both support:
  - Single character (e.g. `;`)
  - Multi-character (e.g. `::`)
  - Special tokens: `\n` (newline)

**C) Preview panel**
- Title: `"Xem trước"`
- Shows:
  - Total detected cards: `N`
  - Cards list preview (virtualized if large)
  - For each card: Term + Definition rendered with line breaks

**D) Error panel**
- If parse errors exist:
  - Show count + list of issues
  - Highlight corresponding lines in textarea

---

## 4) Business Rules (Given/When/Then)

### Parsing & Preview
**BR-IMP-01**
Given user pasted text  
When input changes or settings change  
Then preview updates within 300ms (debounced)

**BR-IMP-02**
Given preview is generated  
Then show:
- `Detected cards: N`
- First 10 cards preview (or virtual list)

**BR-IMP-03**
Given N = 0  
Then disable “Import” button  
And show message: `"Chưa nhận diện được thẻ nào. Hãy kiểm tra định dạng."`

### Default options
**BR-IMP-10 (Default Tab)**
Given mode is “Tab”  
When parsing  
Then each non-empty line is split at first TAB into (term, definition)  
And extra tabs remain inside definition

**BR-IMP-11 (Default ::)**
Given mode is “::”  
When parsing  
Then split at first occurrence of `::`

### Custom separators
**BR-IMP-20**
Given mode is Custom  
When user sets Q-A separator and Card separator  
Then parsing uses:
- Card separator to split blocks into cardChunks
- Q-A separator to split each chunk into (term, definition)

**BR-IMP-21**
Given a cardChunk does not contain Q-A separator  
Then mark it invalid  
And show error “Thiếu ký tự tách Câu hỏi - Trả lời”

### Cleanup & tolerance
**BR-IMP-30**
Given input contains multiple blank lines  
Then treat consecutive blank lines as potential card separators (only in Tab mode)

**BR-IMP-31**
Trim whitespace around term/definition  
But preserve internal line breaks in definition.

### Import action
**BR-IMP-40**
Given N > 0 and user clicks “Nhập N thẻ”  
Then open confirm:
- `"Bạn muốn thêm N thẻ vào bộ thẻ này?"`
- Buttons: `"Hủy"` / `"Nhập"`

**BR-IMP-41**
Given confirm Import  
Then add cards to current set in-memory form state  
And close modal  
And show toast: `"Đã thêm N thẻ"`

**BR-IMP-42**
Given parsing contains some invalid chunks  
Then user may still import valid cards  
But confirm modal must show:
- `"Hợp lệ: X, Lỗi: Y"`

### Draft autosave
**BR-IMP-50**
Given user types/pastes in textarea  
Then autosave draft (text + settings) keyed by setId within 1s

**BR-IMP-51**
Given user reopens import  
Then restore last draft for that setId  
And show small banner: `"Đã khôi phục bản nháp"`

### Safety limits
**BR-IMP-60**
Given N > 500  
Then show warning: `"Bạn đang nhập rất nhiều thẻ (N). Có thể mất vài giây."`  
And require confirm.

**BR-IMP-61**
Given any single term/definition length > 2000 chars  
Then mark as invalid with message `"Nội dung quá dài"`

---

## 5) Validation Rules
- Separator fields cannot be empty in Custom mode
- Must prevent separators from being identical if it causes ambiguity (warn, not hard block)
- Import disabled if:
  - N = 0
  - All chunks invalid
- Inline errors in Vietnamese, friendly tone

---

## 6) Fail-safe UX
- If parsing crashes, show:
  - `"Có lỗi khi xử lý nội dung. Vui lòng thử lại."`
- Never lose user text

---

## 7) Test Plan (must)
### E2E (browser control or Playwright)
1) Paste Tab format → preview correct N
2) Paste :: format → preview correct
3) Custom separators (multi-char) → preview correct
4) Input with messy blank lines → still parses
5) Some invalid chunks → valid import still works with X/Y summary
6) Autosave draft restore
7) Large N warning confirm
8) Very long content invalidation

---

## 8) Prompt for AI Implementer
```text
Implement Bulk Import UX VN-first per this requirement.
Do not change auth or other study modes.
Focus on: modal/sheet UI, parsing engine, preview, error highlighting, autosave draft, and e2e tests.
Use Vietnamese UI copy exactly as specified.
```
