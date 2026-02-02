# Hanzi (Chinese Characters) UX Uplift v1

**Version**: v1  
**Type**: Technical Requirement (UI typography + UX enhancement)  
**Doc language**: English  
**UI copy/labels**: Vietnamese-only  
**Extends**: `kaiti-font-support-v1.md`

**Goal**: Enforce KaiTi font everywhere for Han characters + auto font-size boost (+3px default, user-adjustable 0-8px).

---

## 1) Scope

### 1.1 Hard Enforcement (NO EXCEPTIONS)
- Any visible text containing Han characters **MUST** render using KaiTi (or bundled AppKaiti) in **ALL** screens/features:
  - Create/Edit Set
  - Bulk Import
  - Home list
  - Set detail
  - Flashcards
  - Learn (all question types)
  - Test
  - Results/Review
  - Modals
  - Toasts (if they contain Han)

### 1.2 Auto Size Boost + User Adjustment
- Any text containing Han characters automatically increases font-size by **+3px** over the current computed size.
- User can adjust this extra boost at runtime: **0px to 8px** (step 1px)
- Default boost = **+3px**
- Must persist in localStorage: `ui:hanziBoostPx`
- Must not break layout on mobile (375px viewport)

---

## 2) UX Principles

- **Zero configuration**: Auto-apply when Han characters detected
- **User control**: Adjustable boost for accessibility/preference
- **Performance**: Avoid heavy DOM scanning loops
- **Layout stability**: Boost must not cause overflow/clipping

---

## 3) Implementation Strategy

### 3.1 Centralized Typography Contract
- **CSS class**: `.hanzi-text`
  - Enforces font-family: AppKaiti/KaiTi fallback chain
  - Applies font-size boost: `calc(1em + var(--hanzi-boost, 3px))`
  - Uses CSS variable `--hanzi-boost` for runtime adjustment

### 3.2 Detection Utility
- Reuse existing `containsHan(text)` from `typography.ts`
- Regex: `/[\u4E00-\u9FFF]/`

### 3.3 SmartText Component
- Wrapper component: `<SmartText text="..."/>`
- If `containsHan(text)` → wrap in `<span class="hanzi-text">...</span>`
- Else return normal text
- Use everywhere user-generated text is rendered

### 3.4 User Control
- **Option A (Recommended)**: Global setting in "Hiển thị" modal under general UI settings
  - Label: "Tăng cỡ chữ Hán tự"
  - Slider: 0px → 8px (step 1px)
  - Default: 3px
  - Show current value: "+3px"
  - Persist in localStorage: `ui:hanziBoostPx`

- **Option B (If no settings area)**: Small gear icon on Set Detail page
  - Opens popover with slider
  - Still persists globally

### 3.5 CSS Variable Initialization
- On app boot: Read `localStorage.getItem('ui:hanziBoostPx')` (default 3)
- Set on `document.documentElement`: `--hanzi-boost: {n}px`
- On slider change: Update variable live + persist

---

## 4) Business Rules

### BR-HZ-001 (Hard Enforcement)
Given any text node contains Han characters  
Then it **MUST** render with `.hanzi-text` class  
And computed font-family includes AppKaiti/KaiTi

### BR-HZ-002 (Size Boost)
Given text contains Han characters  
Then computed font-size = base + `var(--hanzi-boost)`  
And default boost = 3px

### BR-HZ-003 (User Adjustment)
Given user adjusts boost slider  
Then CSS variable updates immediately  
And value persists in localStorage  
And persists across page refreshes

### BR-HZ-004 (Non-Han Text)
Given text contains no Han characters  
Then no `.hanzi-text` class applied  
And font-size remains at base

---

## 5) Where to Apply (Complete Inventory)

### 5.1 Create/Edit Set
- Term input text
- Definition input text
- Card preview rows (Term/Definition cells)

### 5.2 Bulk Import
- Preview cards list
- Term/Definition preview cells

### 5.3 Home List
- Set title (if contains Han)
- Set description (if contains Han)
- Card preview snippets

### 5.4 Set Detail
- Set title
- Set description
- Card list preview (Term/Definition)

### 5.5 Flashcards
- Card face text (Term/Definition)

### 5.6 Learn Mode
- Prompt text
- Option labels (MCQ/Multi-select)
- Feedback correct answer line

### 5.7 Test Mode
- Question prompt
- Options list
- Results review (correct answer, user answer)

### 5.8 Modals/Toasts
- Any text content containing Han

---

## 6) Test Plan

### 6.1 Test Dataset
Create set "Hanzi Uplift Test" with cards:
- 漢字 :: Chinese characters
- 学习 :: to study
- HSK 1 漢字 2026 :: mix
- 你好！ :: punctuation
- nv3 / nǚ :: Latin (control)

### 6.2 Test Matrix
**T-HZ-01** Create/Edit: Han renders KaiTi + boosted size  
**T-HZ-02** Bulk import preview: Han renders KaiTi + boosted size  
**T-HZ-03** Home list + Set detail preview: Han renders KaiTi + boosted size  
**T-HZ-04** Flashcards front/back: Han renders KaiTi + boosted size  
**T-HZ-05** Learn (MCQ/Written/Multi): prompt/options/feedback Han renders KaiTi + boosted size  
**T-HZ-06** Test + Results: all Han renders KaiTi + boosted size  
**T-HZ-07** Slider adjust:
- Set boost to 0px → Han font-size equals base
- Set boost to 8px → Han font-size increases
- Refresh → persists

**T-HZ-08** Mobile 375px:
- No overflow/clipping due to boost
- Buttons still reachable

### 6.3 Evidence Requirement
For each major screen:
- Capture DevTools computed font-family (must include AppKaiti/KaiTi)
- Capture computed font-size (must be base + boost)
- Compare Han vs Latin in same component

---

## 7) Validation Rules

### VR-HZ-001 (Font Enforcement)
For any Han-containing element:
- Computed `font-family` must include AppKaiti/KaiTi
- "Rendered Fonts" in DevTools confirms actual used font

### VR-HZ-002 (Size Boost)
- Han element font-size = base + boost (default +3px)
- After slider set to 0px: Han equals base
- After slider set to 8px: Han increases accordingly

### VR-HZ-003 (Layout Stability)
- No overflow/clipping on mobile 375px
- Buttons remain reachable
- No horizontal scroll introduced

---

END OF REQUIREMENT

