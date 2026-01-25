# Quizlet Clone - Technical & Business Context Document

**Generated:** 2025-01-XX  
**Purpose:** Comprehensive technical and business context for AI-assisted development  
**Scope:** Full codebase analysis based on actual implementation

---

## PHASE 0 — PROJECT OVERVIEW

### Tech Stack

**Framework & Runtime:**
- **Next.js 16.1.2** (App Router)
- **React 19.2.3** (with React DOM)
- **TypeScript 5.x** (strict mode enabled)
- **Turbopack** (Next.js bundler)

**State Management:**
- **Zustand 5.0.10** - Used for Flashcards mode state (`src/ui/store/flashcardsStore.ts`)
- **React useState/useEffect** - Used for Learn Mode and Test Mode (component-level state)
- **No global state management** for Sets/Cards (fetched via DI container on demand)

**Styling:**
- **Tailwind CSS 4.x** - Utility-first CSS framework
- **CSS Variables** - Theme system via `app/globals.css` (`--color-primary`, `--color-card`, etc.)
- **Lucide React 0.562.0** - Icon library
- **clsx + tailwind-merge** - Conditional class utilities

**Routing:**
- **Next.js App Router** - File-based routing
- **Dynamic routes:** `[id]`, `[setId]`
- **Canonical routes:**
  - `/` - Home/Library
  - `/sets/new` - Create set
  - `/sets/[id]` - Set detail
  - `/sets/[id]/edit` - Edit set
  - `/study/[setId]/flashcards` - Flashcards mode (canonical)
  - `/study/[setId]/learn` - Learn mode (canonical)
  - `/sets/[id]/study/test` - Test mode (legacy route, still functional)

**Persistence:**
- **localStorage** - Primary persistence mechanism
  - Sets: `quizlet_sets` (array of Set objects)
  - Flashcards Progress: `quizlet_flashcards_progress_{setId}` (per-set)
  - Learn Session: `quizlet_learn_session_{setId}` (per-set, versioned)
- **No backend/API** - Fully client-side application
- **No IndexedDB** - localStorage only

**Architecture Pattern:**
- **Clean Architecture / Hexagonal Architecture**
  - `src/domain/` - Entities, value objects, repositories (interfaces), services
  - `src/application/` - Use cases, DTOs
  - `src/infrastructure/` - Repository implementations (localStorage)
  - `src/ui/` - React components, stores, UI utilities
  - `src/lib/` - DI container, utilities
- **Dependency Injection** - Manual DI via `src/lib/di.ts` (singleton container)
- **Repository Pattern** - Interfaces in domain, implementations in infrastructure

**Testing:**
- **Vitest 4.0.17** - Unit testing
- **Playwright 1.57.0** - E2E testing
- **@testing-library/react** - Component testing

**Build Tools:**
- **ESLint** - Linting
- **PostCSS** - CSS processing
- **TypeScript** - Type checking

---

## PHASE 1 — DATA MODELS (AS IMPLEMENTED)

### Set Entity

**Location:** `src/domain/entities/Set.ts`

**Fields:**
```typescript
{
  id: SetId (value object)
  title: string (required, min 1 char, trimmed)
  description: string (optional, trimmed)
  cards: Card[] (array, max 500 cards - Set.MAX_CARDS)
  createdAt: Date
  updatedAt: Date
}
```

**Business Rules:**
- Title required, non-empty after trim
- Maximum 500 cards per set (enforced in `addCard()`)
- Cards maintain sequential `position` (auto-reordered on deletion)
- `canStudy()` returns true if `cards.length > 0`

**Persistence:**
- Stored in `localStorage` key: `quizlet_sets` (array)
- Format: JSON with ISO date strings
- Repository: `LocalStorageSetRepository` (`src/infrastructure/persistence/LocalStorageSetRepository.ts`)

**Relationships:**
- One Set contains many Cards (aggregate root)
- Cards belong to exactly one Set

**Where Created/Updated:**
- Created: `CreateSet` use case → `Set.create()` → `setRepository.save()`
- Updated: `UpdateSet` use case → `set.update()` → `setRepository.save()`
- Cards added: `AddCard` use case → `set.addCard()` → `setRepository.save()`
- Cards updated: `UpdateCard` use case → `set.updateCard()` → `setRepository.save()`
- Cards deleted: `DeleteCard` use case → `set.removeCard()` → `setRepository.save()`

---

### Card Entity

**Location:** `src/domain/entities/Card.ts`

**Fields:**
```typescript
{
  id: CardId (value object)
  term: string (required, non-empty after trim)
  definition: string (required, non-empty after trim)
  position: number (non-negative, sequential within set)
  createdAt: Date
  updatedAt: Date
}
```

**Business Rules:**
- Term and definition required, non-empty after trim
- Position auto-assigned on add (end of list)
- Position auto-reordered on card deletion (via `Set.reorderCards()`)

**Persistence:**
- Stored as part of Set in `quizlet_sets` array
- Not stored independently

**Relationships:**
- Belongs to one Set (via Set.cards array)
- Referenced by `CardKey` value object for Flashcards progress tracking

**Where Created/Updated:**
- Created: `AddCard` use case → `Card.create()` → added to Set → `setRepository.save()`
- Updated: `UpdateCard` use case → `set.updateCard()` → `setRepository.save()`
- Deleted: `DeleteCard` use case → `set.removeCard()` → `setRepository.save()`

---

### Learn Session (Learn Mode)

**Location:** `src/ui/lib/learn/learnSessionBuilder.ts`, `src/ui/lib/learn/learnPersistence.ts`

**Types:**
```typescript
LearnSession {
  setId: string
  items: LearnItem[]
}

LearnItem {
  itemId: string (format: "item-{cardId}-{index}")
  cardId: string
  type: "TERM_TO_DEF" (only type implemented)
  prompt: string (card.term)
  correctAnswer: string (card.definition)
  options: LearnOption[] (min 1, max 4, shuffled deterministically)
  createdAtIndex: number
}

LearnOption {
  optionId: string
  label: string (display text, may be truncated in UI)
  value: string (full text for comparison)
  isCorrect: boolean
}

LearnPersistenceState {
  version: string ("v2" - CURRENT_VERSION)
  setId: string
  items: LearnItem[]
  statusByItemId: Record<string, LearnStatus>
  currentIndex: number (index within poolItemIds)
  attempt: number (starts at 1)
  poolItemIds: string[] (subset of items for current attempt)
  maxProgressPercent: number (non-decreasing)
  createdAt: string (ISO)
  updatedAt: string (ISO)
}

LearnStatus: "unseen" | "correct" | "incorrect" | "skipped"
```

**Business Rules:**
- One item per card (BR-SES-001)
- Item order follows card order (BR-SES-002)
- Options: `min(4, totalCards)` (BR-MCQ-001)
- Exactly one correct option (BR-MCQ-002)
- Distractors from same set (BR-MCQ-003)
- Uniqueness by normalized label (BR-MCQ-004)
- Stable option order per item (deterministic shuffle with seed) (BR-MCQ-006)
- Sticky correct rule: once correct, never regresses (BR-ADP-004)
- Retry pool = incorrect + skipped only (BR-ADP-020)
- Retry pool shuffled for `attempt >= 2` (BR-ADP-022)
- Progress percent = `floor(correctCount / totalCount * 100)` (BR-ADP-2.1)
- Progress percent must not decrease (BR-ADP-2.2)

**Persistence:**
- Stored in `localStorage` key: `quizlet_learn_session_{setId}`
- Schema versioned (`version: "v2"`)
- Safe fallback: if version mismatch or corrupt, returns `null` → triggers fresh session (BR-ADP-040)
- Persisted after every answer/skip action (BR-PRS-001)
- Resume: same items, options, statuses, index, pool order (BR-PRS-002)

**Where Created/Updated:**
- Created: `buildLearnSessionFromCards()` → `buildInitialLearnState()` (attempt=1, full pool)
- Updated: User answers/skips → `handleSelectOption()` / `handleSkip()` → `persistState()`
- Retry: Completion screen → "Học lại các câu sai" → new pool (incorrect+skipped), `attempt++`
- Reset: "Học lại từ đầu" → `clearLearnSession()` → `buildInitialLearnState()`

---

### Flashcards Progress

**Location:** `src/domain/entities/FlashcardsProgress.ts`

**Fields:**
```typescript
{
  setId: SetId
  order: "original" | "shuffled"
  shuffledOrder?: string[] (CardKey strings, stable shuffle)
  shuffledSeed?: string (alternative to shuffledOrder)
  index: number (0-based, current card position)
  side: "term" | "definition" (current card side)
  knownMap: Record<string, CardStatus> (CardKey -> status)
  lastUpdatedAt: Date
}

CardStatus: "know" | "learning" | "unset"
```

**Business Rules:**
- Default: `order="original"`, `index=0`, `side="term"`, `knownMap={}`
- Shuffle: If `order="shuffled"`, use `shuffledOrder` or regenerate from `shuffledSeed`
- Navigation: `setIndex()` resets `side` to "term" (BR-FLIP-03)
- Status: Can toggle (click active state again to unset) (BR-SET-02)
- Auto-advance: After 300ms if `autoAdvanceEnabled && !isLastCard && !wasUnset` (BR-AUTO-ADV-01)
- Reset: Clears `knownMap`, resets order/index/side (BR-RESET-02)

**Persistence:**
- Stored in `localStorage` key: `quizlet_flashcards_progress_{setId}`
- Saved immediately on state change (BR-PERSIST-01)
- Corruption-safe: returns `undefined` on parse error → triggers fresh progress (BR-PERSIST-03)

**Where Created/Updated:**
- Created: `FlashcardsProgress.create(setId)` → `loadFlashcardsProgress.execute()` (if not found)
- Updated: All store actions (`flip`, `next`, `prev`, `markKnow`, `markLearning`, `toggleShuffle`, `setIndex`) → `saveFlashcardsProgress.execute()`
- Reset: `resetFlashcardsProgress.execute()` → deletes from localStorage → creates fresh

---

### Test Session (Test Mode)

**Location:** `src/domain/entities/StudySession.ts`, `app/sets/[id]/study/test/page.tsx`

**Types:**
```typescript
StudySession {
  setId: SetId
  mode: StudyMode ("TEST")
  cardIds: CardId[]
  currentIndex: number
  results: CardResult[]
  startedAt: Date
  completedAt?: Date
}

CardResult {
  cardId: CardId
  correct: boolean
  attempts: number
  timestamp: Date
}

TestQuestionDTO {
  cardId: string
  type: "MULTIPLE_CHOICE" | "WRITTEN"
  question: string
  correctAnswer: string
  choices?: string[] (for MULTIPLE_CHOICE)
  position: number
}
```

**Business Rules:**
- Minimum 3 cards required (enforced in Test page)
- Questions generated via `TestGenerator.generate()`:
  - Mix of MULTIPLE_CHOICE and WRITTEN (default 50/50 ratio)
  - Questions shuffled
  - Multiple choice: 4 options (1 correct + 3 distractors from other cards)
- Answer validation: Case-insensitive exact match (via `AnswerValidator.validate()`)
- No persistence - Test sessions are ephemeral (not saved)

**Persistence:**
- **NOT PERSISTED** - Test mode is stateless
- Questions regenerated on each test start
- Answers stored only in component state during test

**Where Created/Updated:**
- Created: Test page loads → `generateTest.execute()` → `TestGenerator.generate()`
- Updated: User answers → `submitAnswer.execute()` → stored in component state
- Completed: All questions answered → `isComplete=true` → shows summary

---

## PHASE 2 — FEATURE LOGIC (AS IMPLEMENTED)

### 1) Home / Sets

**Location:** `app/page.tsx`

**Core Functions:**
- `container.listSets.execute()` - Loads all sets
- Client-side search filter (title/description, case-insensitive)

**Business Rules:**
- Shows all sets from localStorage
- Search: Filters by title or description (case-insensitive substring)
- Empty state: Shows "Create your first study set" if no sets
- Delete: Confirmation dialog → `container.deleteSet.execute()` → reloads list

**Missing/Partial:**
- No pagination (all sets loaded at once)
- No sorting options
- No filtering by card count or date

**Duplicated Logic:**
- None identified

---

### 2) Create/Edit/Delete Set

**Location:** 
- Create: `app/sets/new/page.tsx`
- Edit: `app/sets/[id]/edit/page.tsx`
- Delete: `app/page.tsx` (home), `app/sets/[id]/page.tsx` (detail)

**Core Functions:**
- Create: `container.createSet.execute()` → `Set.create()` → `setRepository.save()`
- Edit: `container.updateSet.execute()` → `set.update()` → `setRepository.save()`
- Delete: `container.deleteSet.execute()` → `setRepository.delete()`

**Business Rules:**
- Title required, non-empty
- Description optional
- Cards added via bulk import or individual add (in edit page)
- Maximum 500 cards per set (enforced in domain)

**Missing/Partial:**
- No duplicate set detection
- No validation for special characters or length limits (beyond non-empty)

**Duplicated Logic:**
- SetForm component reused for create/edit

---

### 3) Bulk Import

**Location:** `src/ui/components/sets/ImportOverlay.tsx`, `src/ui/lib/importParse.ts`

**Core Functions:**
- `parseImportText(rawText, cardSeparator, qaSeparator, limit?)` - Pure parsing function
- `detectSeparators(rawText)` - Auto-detection heuristic

**Business Rules (BR-PARSE-*):**
- Normalize line endings (`\r\n` → `\n`)
- Split by card separator (default: `\n`)
- Discard empty blocks
- Split term/definition by QA separator (default: `\t`)
- First occurrence of QA separator used
- Trim term/definition (preserve internal whitespace)
- Validate: term and definition non-empty
- Length limit: 2000 chars per term/definition (BR-IMP-61)
- Tab key: Inserts tab character instead of shifting focus (custom handler)

**Missing/Partial:**
- Auto-detection is simplistic (checks for `\t`, falls back to defaults)
- No support for multi-line definitions
- No validation for duplicate cards

**Duplicated Logic:**
- None identified

---

### 4) Flashcards

**Location:** `app/study/[setId]/flashcards/page.tsx`, `src/ui/store/flashcardsStore.ts`

**Core Functions:**
- `useFlashcardsStore()` - Zustand store
  - `loadProgress()` - Loads/creates progress, determines card order
  - `flip()` - Toggles card side
  - `next()` / `prev()` - Navigation
  - `markKnow()` / `markLearning()` - Status updates with auto-advance
  - `toggleShuffle()` - Toggles order mode
  - `resetProgress()` - Clears progress

**Business Rules:**
- **BR-FLIP-01/02:** Flip toggles term ↔ definition
- **BR-FLIP-03:** Navigation resets side to "term"
- **BR-NAV-01/02:** Next/prev with bounds checking
- **BR-KNOW-01/LEARN-01:** Mark status (know/learning)
- **BR-SET-01/02:** Status can be toggled (click again to unset)
- **BR-SHUFF-01/02:** Toggle shuffle, maintains stable order via `shuffledOrder` or `shuffledSeed`
- **BR-AUTO-ADV-01:** Auto-advance after 300ms if enabled and not last card
- **BR-PERSIST-01/02/03:** Immediate persistence, resume on load, corruption-safe
- **BR-RESET-02:** Reset clears all statuses, resets order/index/side
- **BR-PROG-02:** Stats computed from `knownMap`

**Missing/Partial:**
- No "study incorrect cards only" feature
- No card filtering by status
- No export progress feature

**Duplicated Logic:**
- Shuffle logic duplicated between Learn Mode and Flashcards (different implementations)

---

### 5) Learn Mode

**Location:** `app/study/[setId]/learn/page.tsx`

**Core Functions:**
- `buildLearnSessionFromCards()` - Session builder (deterministic)
- `buildOptionsForItem()` - Option generation (BR-MCQ-001..007)
- `normalizeLabel()` - Uniqueness normalization
- `shuffleWithSeed()` - Deterministic shuffle
- `buildInitialLearnState()` - Fresh session state
- `loadLearnSession()` / `saveLearnSession()` - Persistence
- `handleSelectOption()` - Answer handling with sticky correct
- `handleSkip()` - Skip with sticky correct
- `handleContinue()` - Progression
- `handleRetryBuild()` - Retry on error
- `handleRestartFromScratch()` - Full reset

**Business Rules:**
- **BR-SES-001..004:** Session build rules (one item per card, order, error handling)
- **BR-MCQ-001..007:** Option generation (count, correctness, distractors, uniqueness, stability)
- **BR-ANS-*:** Answer feedback (correct/incorrect, show correct answer)
- **BR-KBD-001/002/003:** Keyboard shortcuts (1..K select, Enter continue, Esc back, focus management)
- **BR-PRS-001/002/003:** Persistence (immediate save, resume, versioning)
- **BR-ADP-001..031:** Adaptive retry (statuses, sticky correct, retry pool, completion variants)
- **BR-ADP-2.1/2.2:** Progress banner (label, percent calculation, non-decreasing)

**Missing/Partial:**
- Only TERM_TO_DEF type (no reverse)
- No written answer mode (MCQ only)
- No hints feature
- No spaced repetition logic

**Duplicated Logic:**
- Shuffle logic (different from Flashcards, but similar concept)

---

### 6) Test Mode

**Location:** `app/sets/[id]/study/test/page.tsx`, `src/application/use-cases/study/GenerateTest.ts`, `src/domain/services/TestGenerator.ts`

**Core Functions:**
- `generateTest.execute()` - Use case
- `TestGenerator.generate()` - Domain service (question generation)
- `submitAnswer.execute()` - Answer validation
- `AnswerValidator.validate()` - Domain service (case-insensitive match)

**Business Rules:**
- Minimum 3 cards required
- Mix of MULTIPLE_CHOICE and WRITTEN (default 50/50)
- Multiple choice: 4 options (1 correct + 3 distractors)
- Questions shuffled
- Answer validation: Case-insensitive exact match (trimmed)
- No persistence (ephemeral)

**Missing/Partial:**
- No question type selection (always 50/50)
- No difficulty levels
- No partial credit
- No retry incorrect questions feature
- No test history

**Duplicated Logic:**
- Answer validation logic shared with Learn Mode (via `AnswerValidator`)

---

## PHASE 3 — LEARN MODE LOGIC DEEP DIVE

### What Logic Exists?

**Session Building:**
- `buildLearnSessionFromCards()` - Creates one `LearnItem` per card
- Each item has type `TERM_TO_DEF` (term shown, definition as answer)
- Options generated via `buildOptionsForItem()`:
  - Correct option: card's definition
  - Distractors: Other cards' definitions from same set
  - Option count: `min(4, totalCards)`
  - Uniqueness: Normalized label comparison
  - Order: Deterministic shuffle with seed `${setId}-${cardId}-${index}`

**Answer Evaluation:**
- Exact match: `option.isCorrect === true` (no fuzzy matching)
- Feedback: Shows "Đúng rồi!" or "Chưa đúng" with correct answer

**State Tracking:**
- `statusByItemId`: Record of item statuses (unseen/correct/incorrect/skipped)
- `currentIndex`: Position within `poolItemIds`
- `attempt`: Current attempt number (starts at 1)
- `poolItemIds`: Subset of items for current attempt
- `maxProgressPercent`: Non-decreasing progress tracker

**Adaptive Logic:**
- **Sticky Correct (BR-ADP-004):** Once an item is marked correct, it never regresses to incorrect/skipped
- **Retry Pool (BR-ADP-020):** On completion, if incorrect/skipped exist, retry pool = those items only
- **Retry Shuffle (BR-ADP-022):** Retry pool shuffled for `attempt >= 2`
- **Completion Variants (BR-ADP-010):** 
  - Variant A: "Chưa xong đâu" + "Học lại các câu sai" (if incorrect+skipped exist)
  - Variant B: "Hoàn thành" + "Học lại từ đầu" (if all correct)
- **Progress Banner (BR-ADP-2.1/2.2):** Shows `floor(correctCount/totalCount*100)` with motivational text

**What Resets State?**
- **"Học lại từ đầu" (BR-ADP-031):** `clearLearnSession()` → `buildInitialLearnState()` (full reset)
- **Version mismatch (BR-ADP-040):** `loadLearnSession()` returns `null` → triggers fresh session
- **Card count mismatch:** `loadLearnSession()` returns `null` → triggers fresh session

**Is Any Adaptive Logic Present?**
- Yes: Sticky correct, retry pool, retry shuffle, completion variants, progress tracking

**Written Answer vs MCQ?**
- **MCQ only** - No written answer mode in Learn Mode
- Test Mode has written answers, but Learn Mode is strictly MCQ

**Multiple Learn Implementations?**
- Only one implementation: `/study/[setId]/learn` (canonical route)
- Legacy route `/sets/[id]/study/learn` may exist but not analyzed (assumed deprecated)

---

## PHASE 4 — PERSISTENCE & RESET RULES

### What Persists on Refresh?

**Sets:**
- ✅ All sets persist (localStorage: `quizlet_sets`)
- ✅ Cards persist as part of sets
- ✅ Created/updated timestamps persist

**Flashcards Progress:**
- ✅ Progress persists per setId (localStorage: `quizlet_flashcards_progress_{setId}`)
- ✅ Order mode (original/shuffled) persists
- ✅ Shuffled order/seed persists
- ✅ Current index persists
- ✅ Current side (term/definition) persists
- ✅ Known map (statuses) persists
- ✅ Last updated timestamp persists

**Learn Session:**
- ✅ Session persists per setId (localStorage: `quizlet_learn_session_{setId}`)
- ✅ Items persist (full session structure)
- ✅ Statuses persist (`statusByItemId`)
- ✅ Current index persists
- ✅ Attempt number persists
- ✅ Pool item IDs persist
- ✅ Max progress percent persists
- ✅ Created/updated timestamps persist

**Test Session:**
- ❌ **NOT PERSISTED** - Test mode is stateless

---

### What Persists Across Navigation?

**Sets:**
- ✅ Persist across all navigation (localStorage)

**Flashcards Progress:**
- ✅ Persists when navigating away and back
- ✅ Resume: Same card order, index, side, statuses

**Learn Session:**
- ✅ Persists when navigating away and back
- ✅ Resume: Same items, options, statuses, index, pool order

**Test Session:**
- ❌ Lost on navigation (not persisted)

---

### What Resets When?

**Sets:**
- Reset: Only on explicit delete (`container.deleteSet.execute()`)

**Flashcards Progress:**
- Reset triggers:
  1. User clicks "Reset Progress" button → `resetProgress()` → `resetFlashcardsProgress.execute()`
  2. Corruption detected → returns `undefined` → creates fresh progress
- Reset clears: `knownMap`, `order` (to original), `index` (to 0), `side` (to term)

**Learn Session:**
- Reset triggers:
  1. User clicks "Học lại từ đầu" → `clearLearnSession()` → `buildInitialLearnState()`
  2. Version mismatch → `loadLearnSession()` returns `null` → `buildInitialLearnState()`
  3. Card count mismatch → `loadLearnSession()` returns `null` → `buildInitialLearnState()`
- Reset clears: All statuses, resets to attempt=1, full pool, index=0

**Test Session:**
- Reset: Every test start (always fresh)

---

### How Reset is Triggered (Code Paths)

**Flashcards:**
```
User clicks "Reset Progress"
  → ResetProgressModal confirms
  → handleReset() in FlashcardsPage
  → resetProgress(setId) in store
  → container.resetFlashcardsProgress.execute(setId)
  → LocalStorageFlashcardsProgressRepository.delete(setId)
  → loadProgress() creates fresh progress
```

**Learn Mode:**
```
User clicks "Học lại từ đầu"
  → handleRestartFromScratch()
  → clearLearnSession(setId) (removes from localStorage)
  → initializeSession(true) (forceNew=true)
  → buildInitialLearnState(setId, cards)
  → Fresh state with attempt=1, full pool
```

---

## PHASE 5 — CONSTRAINTS & TECH DEBT

### Areas Fragile to Change

1. **Learn Mode Persistence Schema:**
   - Version string (`"v2"`) hardcoded in multiple places
   - Schema changes require version bump + migration logic (not implemented)
   - Risk: Breaking changes to persistence format will lose user data

2. **CardKey Generation:**
   - Flashcards mode uses `CardKey.fromCardId()` or `CardKey.fromSetIdAndIndex()` fallback
   - If card IDs change, progress tracking breaks
   - Risk: Progress lost if card structure changes

3. **Deterministic Shuffle Seeds:**
   - Learn Mode: `${setId}-${cardId}-${index}`
   - Flashcards: `Date.now().toString()` (not deterministic across sessions)
   - Risk: Inconsistent shuffle behavior

4. **localStorage Quota:**
   - No quota management
   - Error handling exists but no user-facing cleanup
   - Risk: App breaks silently when quota exceeded

---

### Areas Tightly Coupled to UI

1. **Learn Mode State:**
   - State management in component (`useState` hooks)
   - Not extractable to store without refactoring
   - Risk: Hard to test, hard to reuse logic

2. **Test Mode State:**
   - Fully component-level state
   - No domain model for test session (uses DTOs directly)
   - Risk: Business logic mixed with UI

3. **Flashcards Store:**
   - Zustand store is UI-specific (not domain layer)
   - Auto-advance logic in store (UI concern)
   - Risk: Hard to test business logic independently

---

### Areas Hard to Test

1. **localStorage Operations:**
   - No abstraction for storage (direct `localStorage` calls)
   - Requires mocking `window.localStorage` in tests
   - Risk: Tests brittle, hard to test edge cases

2. **Deterministic Shuffle:**
   - Seed-based shuffle logic not unit tested
   - Risk: Bugs in shuffle logic hard to catch

3. **Learn Mode Persistence:**
   - Version migration logic not tested
   - Corruption scenarios not tested
   - Risk: Data loss scenarios not covered

4. **Answer Validation:**
   - `AnswerValidator` has TODOs for fuzzy matching
   - Current implementation: case-insensitive exact match only
   - Risk: False negatives for typos

---

### Areas Likely to Break When UX is Refactored

1. **Keyboard Shortcuts:**
   - Learn Mode: Event listeners attached to `window`
   - Focus management via refs
   - Risk: Breaks if component structure changes

2. **Auto-advance Timing:**
   - Flashcards: `setTimeout(300ms)` hardcoded
   - Learn Mode: Double-click protection (`300ms` debounce)
   - Risk: Timing-sensitive, breaks if UX changes

3. **Progress Banner:**
   - Learn Mode: Progress calculation in component
   - Motivational text hardcoded in component
   - Risk: Breaks if moved to different component

4. **Data Test IDs:**
   - Many `data-testid` attributes for E2E tests
   - Risk: Breaks tests if IDs change during refactor

---

## PHASE 6 — OPEN QUESTIONS (MANDATORY)

### Persistence & Data

1. **Is Learn session meant to be persisted long-term?**
   - **UNKNOWN** - Currently persists indefinitely, but no cleanup logic
   - Question: Should old sessions expire? After how long?

2. **Are IDs stable across sessions?**
   - **PARTIALLY KNOWN** - `SetId` and `CardId` use `nanoid`, which are stable once created
   - **UNKNOWN** - What happens if a set is deleted and recreated with same name? (New IDs)

3. **Should Test Mode be persisted?**
   - **CURRENTLY NO** - Test sessions are ephemeral
   - Question: Should test history be saved? For analytics?

4. **What happens when localStorage quota is exceeded?**
   - **PARTIALLY KNOWN** - Error handling exists, but no user-facing recovery
   - Question: Should we implement cleanup/compression? Or migrate to IndexedDB?

---

### Business Logic

5. **Is Test Mode supposed to reuse Learn logic?**
   - **NO** - Test Mode uses `TestGenerator`, Learn Mode uses `learnSessionBuilder`
   - Question: Should they share option generation logic? (Currently duplicated)

6. **Should Learn Mode support written answers?**
   - **CURRENTLY NO** - Learn Mode is MCQ only
   - Question: Is written answer mode planned? (Test Mode has it)

7. **Should Flashcards support reverse mode (definition → term)?**
   - **CURRENTLY NO** - Only term → definition
   - Question: Is reverse mode planned?

8. **What is the intended behavior when a set's cards change during an active Learn session?**
   - **UNKNOWN** - Current behavior: Card count mismatch triggers fresh session
   - Question: Should we handle card updates gracefully? (e.g., remove items for deleted cards)

---

### Adaptive Features

9. **Should Learn Mode implement spaced repetition?**
   - **CURRENTLY NO** - Only adaptive retry (incorrect/skipped)
   - Question: Is spaced repetition planned? (e.g., review correct items after X days)

10. **Should Flashcards support "study incorrect cards only"?**
    - **CURRENTLY NO** - All cards shown
    - Question: Is this feature planned?

11. **Should progress tracking be shared between Flashcards and Learn Mode?**
    - **CURRENTLY NO** - Separate tracking
    - Question: Should "know" status in Flashcards affect Learn Mode? (or vice versa)

---

### Technical Architecture

12. **Should we migrate from localStorage to IndexedDB?**
    - **CURRENTLY NO** - localStorage only
    - Question: For better quota management? For structured queries?

13. **Should we implement a backend API?**
    - **CURRENTLY NO** - Fully client-side
    - Question: For multi-device sync? For sharing sets?

14. **Should we extract Learn Mode state to a Zustand store?**
    - **CURRENTLY NO** - Component-level state
    - Question: For consistency with Flashcards? For easier testing?

15. **Should we implement a proper migration system for persistence schemas?**
    - **CURRENTLY NO** - Version check only, no migration
    - Question: For safe schema evolution?

---

### User Experience

16. **Should Learn Mode support multiple question types (TERM_TO_DEF, DEF_TO_TERM)?**
    - **CURRENTLY NO** - Only TERM_TO_DEF
    - Question: Is reverse mode planned?

17. **Should Test Mode allow custom question selection?**
    - **CURRENTLY NO** - All cards included (or random subset)
    - Question: Should users be able to select specific cards?

18. **Should there be a "study incorrect cards only" feature in Flashcards?**
    - **CURRENTLY NO** - All cards shown
    - Question: Is this feature planned?

19. **What is the intended behavior when a user deletes a set that has active progress?**
    - **PARTIALLY KNOWN** - Progress remains in localStorage (orphaned)
    - Question: Should we clean up orphaned progress? Or allow recovery?

---

## APPENDIX A — ROUTE STRUCTURE

### Canonical Routes

```
/                                    → Home/Library (app/page.tsx)
/sets/new                            → Create Set (app/sets/new/page.tsx)
/sets/[id]                           → Set Detail (app/sets/[id]/page.tsx)
/sets/[id]/edit                      → Edit Set (app/sets/[id]/edit/page.tsx)
/study/[setId]/flashcards            → Flashcards Mode (app/study/[setId]/flashcards/page.tsx)
/study/[setId]/learn                 → Learn Mode (app/study/[setId]/learn/page.tsx)
/sets/[id]/study/test                → Test Mode (app/sets/[id]/study/test/page.tsx) [Legacy route]
```

**Note:** Test Mode uses legacy route `/sets/[id]/study/test` while Flashcards and Learn use canonical `/study/[setId]/*`. This inconsistency should be addressed.

---

## APPENDIX B — KEY BUSINESS RULES REFERENCE

### Flashcards Mode (BR-*)

- **BR-FLIP-01/02:** Flip toggles term ↔ definition
- **BR-FLIP-03:** Navigation resets side to "term"
- **BR-NAV-01/02:** Next/prev with bounds checking
- **BR-KNOW-01/LEARN-01:** Mark status (know/learning)
- **BR-SET-01/02:** Status can be toggled
- **BR-SHUFF-01/02:** Toggle shuffle with stable order
- **BR-AUTO-ADV-01:** Auto-advance after 300ms
- **BR-PERSIST-01/02/03:** Immediate persistence, resume, corruption-safe
- **BR-RESET-02:** Reset clears all statuses
- **BR-PROG-02:** Stats from knownMap

### Learn Mode (BR-*)

- **BR-SES-001..004:** Session build rules
- **BR-MCQ-001..007:** Option generation rules
- **BR-ANS-*:** Answer feedback
- **BR-KBD-001/002/003:** Keyboard shortcuts
- **BR-PRS-001/002/003:** Persistence
- **BR-ADP-001..031:** Adaptive retry
- **BR-ADP-2.1/2.2:** Progress banner

---

## APPENDIX C — DEPENDENCY INJECTION CONTAINER

**Location:** `src/lib/di.ts`

**Structure:**
- Singleton pattern (`DIContainer.getInstance()`)
- Lazy initialization (repositories and use cases created on first access)
- Swappable implementations (e.g., `LocalStorageSetRepository` → `ApiSetRepository`)

**Current Implementations:**
- `ISetRepository` → `LocalStorageSetRepository`
- `IFlashcardsProgressRepository` → `LocalStorageFlashcardsProgressRepository`
- Use cases: All wired to repositories via constructor injection

**To Swap Implementations:**
1. Create new repository class implementing interface
2. Change assignment in `di.ts` getter
3. No other code changes needed (clean architecture)

---

**END OF DOCUMENT**

