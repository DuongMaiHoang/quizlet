# Project Context: Quizlet-Clone App (UX & Behavior)

**Generated via**: Autonomous Browser Observation  
**Date**: 2026-01-25  
**Scope**: Observed behavior only (no code reading assumptions)

---

## Phase 0: Environment Check
- **Dev Server**: Started with `npm run dev` at `http://localhost:3000`.
- **Status**: Functional.
- **Base State**: App loads to a "Library" (Home) page showing a grid of available study sets.

---

## Phase 1: UX Feature Inventory (Observed)

### 1. Home / Library
- **Status**: Exists.
- **Entry**: Root URL (`/`).
- **Layout**: Simple grid of cards. Each card shows:
  - Title (e.g., "MCQ Test Set")
  - Term count (e.g., "5 terms")
  - User avatar/name
  - "Study" button (Primary action)
  - "Edit" button (Secondary action)
  - Trash icon (Delete action)
- **UX Feel**: Clean, Dark Mode default. No "folders" or "classes" observed, just a flat list of sets.

### 2. Create Set
- **Status**: Exists.
- **Entry**: "+ Create Set" button in the top header.
- **Flow**:
  1. Enter Title.
  2. Enter Description (Optional).
  3. Add cards manually (Term + Definition).
  4. OR use "Nhập nhanh hàng loạt" (Bulk Import).
  5. Click "Create Set" at the bottom.
- **Risks**:
  - The "Bulk Import" feature is sensitive to whitespace. Copy-pasting `Term :: Def` works best if strictly formatted.
  - Large sets might be tedious to enter manually as there is no "Import from CSV" file option, only text paste.

### 3. Edit Set
- **Status**: Exists.
- **Entry**: "Edit" button on Home cards or Set Detail page.
- **Behavior**: Identical to Create Set form, but pre-filled.
- **Observation**: Title and Cards are editable.

### 4. Delete Set
- **Status**: Exists.
- **Entry**: Trash icon on Home cards.
- **Behavior**: Immediate deletion (or simple confirmation). Removes the set from the list.

### 5. Bulk Import
- **Status**: Exists & Functional (with caveats).
- **Entry**: "Nhập nhanh hàng loạt" button on Create/Edit forms.
- **UI**: Modal with a large text area.
- **Flow**:
  - Paste text.
  - Choose separator (Tab or Custom like `::`).
  - Preview list updates in real-time.
  - Click "Nhập xx thẻ".
- **UX Copy**: Vietnamese Labels ("Dán nội dung", "Dấu ::").

### 6. Set Detail Page
- **Status**: Exists.
- **Entry**: Click valid Set Title on Home.
- **Layout**:
  - **Header**: Title, Creator, Term count.
  - **Study Modes**: Row of cards for "Flashcards", "Học" (Learn), "Test".
  - **Card List**: Vertical list of all terms and definitions in the set (view only).
- **Navigation**: Back button (Chevron) returns to Home.

### 7. Flashcards Mode
- **Status**: Exists.
- **Entry**: "Flashcards" card on Set Detail.
- **Interaction**:
  - **Click/Space**: Flips card (Animation: smooth 3D flip).
  - **Arrows/Buttons**: Next/Previous card.
  - **Controls**: Shuffle, Reset.
- **Categorization**: Users can mark cards as "Know" (Tick) or "Still learning" (X), which moves them into sub-stacks.
- **UX Language**: Controls are largely English ("Shuffle", "Options").

### 8. Learn Mode (Học)
- **Status**: Exists (Primary Study Mode).
- **Type**: **MCQ (Multiple Choice) Only**.
- **Entry**: "Học" card on Set Detail.
- **UI Structure**:
  - **Top**: Progress Banner.
    - Motivational Text (e.g., "Cứ từ từ, bạn đang làm tốt rồi.").
    - Progress Bar (0% to 100%).
  - **Center**: Question Card (Definition) + 4 Options (Terms).
  - **Bottom**: "Bỏ qua" (Skip) button.
- **Feedback Loop**:
  - **Correct**: Option turns Green -> "Đúng rồi!" text -> "Tiếp tục" button.
  - **Incorrect**: Selected turns Red, Correct turns Green -> "Chưa đúng" text -> Correct answer shown -> "Tiếp tục" button.
- **Adaptive Behavior**:
  - At the end of the set, if mistakes were made, a summary screen titled "Chưa xong đâu" appears.
  - Offers button: "Học lại các câu sai (n)".
  - Clicking this starts a **Retry Session** with ONLY the incorrect/skipped items.
  - This cycle repeats until 100% mastery.
- **UX Language**: Predominantly Vietnamese.

### 9. Test Mode
- **Status**: Exists.
- **Type**: **Written Answer Only**.
- **Entry**: "Test" card on Set Detail.
- **UI Structure**:
  - Question (Term).
  - Text Input (Placeholder: "Type your answer").
  - "Next Question" button.
- **Behavior**:
  - User types answer.
  - No immediate feedback (unlike Learn).
  - Progression is linear (1 of N).
- **Contrast**: Completely different from Learn mode. Learn is passive/recognition (MCQ), Test is active/recall (Typing).

### 10. Completion Screens
- **Learn Mode**:
  - **Partial Success**: "Chưa xong đâu" (Not done yet) -> Prompt to retry mistakes.
  - **Full Success**: "Hoàn thành" (Completed) -> "Tuyệt vời!..." -> "Học lại từ đầu" (Restart).

### 11. Persistence
- **Status**: Verified.
- **Behavior**: Refreshing the browser during a Learn session preserves:
  - Current question index.
  - Current session progress %.
  - Classification of items (Correct/Incorrect).

### 12. Mobile Behavior
- **Status**: Functional.
- **Observation**:
  - Grid layouts stack vertically.
  - Learn mode buttons (Options, Continue) are easily tappable.
  - Layout is fluid down to 375px width.

---

## Phase 2: Learn Mode Deep Dive

| Feature | Observation |
| :--- | :--- |
| **Input Method** | **MCQ Only**. 4 options generated from other terms in the set. |
| **Feedback** | **Immediate**. User knows right away if they are wrong. |
| **Progression** | **Percentage-based**. Bar fills up as you get "Sticky Correct" answers. |
| **Retry Logic** | **Stateful**. Explicitly separates "Main Pool" from "Retry Pool" (mistakes). |
| **Unfinished?** | No "Written" option inside Learn mode. It relies entirely on MCQ. |

---

## Phase 3: Error & Edge Case Observation

1.  **Mid-flow Refresh**: Handled gracefully. User picks up exactly where left off.
2.  **Rapid Clicking**: UI blocks input during "Feedback State" (between answer and clicking Continue), preventing double-submissions.
3.  **Empty Sets**: Create Set prevents empty sets (assumed, usually entry requires >2 cards), but "Flashcards" on an empty set (if forced) might show a placeholder state (Observed "Chưa có thẻ nào" in code during inventory).
4.  **Navigation**: Clicking "Back" from Learn mode goes to Set Detail. Browser "Back" also works expectedly.

---

## Phase 4: UX Risks & Confusion

1.  **Language Inconsistency**:
    - **Learn Mode**: ~90% Vietnamese ("Học", "Tiếp tục", "Đúng rồi").
    - **Test/Flashcards**: ~80% English ("Test", "Written Answer", "Shuffle", "Know").
    - **Risk**: Feels like two different apps stitched together.

2.  **Mode Disparity**:
    - Users might start "Learn" expecting to type answers (like traditional rote learning), but are forced into MCQ.
    - Users might start "Test" expecting a graded MCQ exam, but are forced into exact-string matching Written answers.
    - **Risk**: Frustration if user prefers one method but selects the wrong mode label.

3.  **Bulk Import Sensitivity**:
    - The `::` separator requires careful formatting. If a user pastes `Term:Definition` (common in other apps), it might fail silently or dump everything into the "Term" field unless they manually switch separators.

4.  **"Test" vs "Learn" Overlap**:
    - Both measure knowledge, but "Learn" is adaptive/hand-holding, whereas "Test" is a raw dump of questions. The value proposition of "Test" is lower if it doesn't grade you or offer retry logic (Observed behavior: Test mode just runs through).

---

## Phase 5: Open Questions

1.  **Is the "Written Answer" functionality intended for Learn Mode?**
    - *Observation*: Currently, Learn is exclusively MCQ. Test is exclusively Written. Quizlet original often mixes them.
    - *Unknown*: Is this a scope cut or a bug?

2.  **Should "Test Mode" have adaptive qualities?**
    - *Observation*: Test mode seems linear and "dumb" (just listed questions).
    - *Unknown*: intended to be a robust exam simulator or just a placeholder?

3.  **Why is the language split?**
    - *Observation*: Core persistence/Learn logic is heavily localized. Wrappers/Other modes are not.
    - *Unknown*: Is there a mandate to move to 100% VN?

4.  **Are there plans for "Spaced Repetition"?**
    - *Observation*: "Learn" mode retries *within* a session, but doesn't seem to schedule cards for *tomorrow*.
    - *Unknown*: True long-term learning vs. cramming session?
