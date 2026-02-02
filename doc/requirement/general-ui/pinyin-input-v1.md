# Pinyin Input Support v1.1 — Keyboard Shortcut Toggle

**Version**: v1.1 (append to Pinyin Input v1)  
**Doc language**: English  
**UI copy/labels**: Vietnamese-only  
**Goal**: Add an easy keyboard shortcut to toggle Pinyin mode ON/OFF while typing, without disrupting normal typing shortcuts.

---

## 1) Scope
- Add keyboard shortcut to toggle Pinyin mode for:
  - Create/Edit Set Term input
  - Create/Edit Set Definition input
  - (Optional) Bulk import textarea if v1 supports it

---

## 2) UX Rules

### 2.1 Shortcut design (recommended)
- Shortcut: **Alt + P**
  - Rationale: easy to remember (“Pinyin”), low collision on Windows, works in most browsers.
- Only active when focus is inside an eligible input/textarea.

### 2.2 Visual feedback
When toggled via shortcut:
- Update the “Pinyin” toggle UI state immediately (ON/OFF).
- Show a small toast near the field (or global toast) for 1.5s:
  - ON: `Pinyin: BẬT`
  - OFF: `Pinyin: TẮT`

If you already have toast system, reuse it.

### 2.3 Per-field behavior
- Toggle affects the **currently focused field only** (Term vs Definition independent).
- If you prefer session-wide toggle (one toggle affects all fields), document it and implement consistently.
Recommended: **per-field** (prevents surprising changes).

---

## 3) Business Rules (Given/When/Then)

### BR-PY-110
Given focus is in a Term/Definition input  
When user presses **Alt + P**  
Then Pinyin mode for that input toggles ON/OFF  
And UI toggle reflects the new state immediately

### BR-PY-111
Given Pinyin toggled ON via shortcut  
Then subsequent tokens like `ni3 hao3` are converted per v1 rules (space/blur)

### BR-PY-112
Given user presses Alt+P outside eligible inputs  
Then nothing happens (no global toggle)

### BR-PY-113
Given user is using IME composition (typing in-progress)  
When Alt+P is pressed  
Then do not interrupt composition; apply toggle after compositionend  
(If not feasible, at minimum: do not corrupt input text.)

---

## 4) Validation / Conflicts
- Must not override browser/system shortcuts (if conflict detected, allow user to still use UI toggle).
- Must call `preventDefault()` only when shortcut is recognized and handled.

---

## 5) Test Plan (UI)
T-PY-11 Focus Term input → Alt+P toggles ON and toast shows “Pinyin: BẬT”  
T-PY-12 Type `ni3 hao3` → converts to `nǐ hǎo`  
T-PY-13 Alt+P toggles OFF and toast shows “Pinyin: TẮT”  
T-PY-14 With OFF, `ma3` remains `ma3`  
T-PY-15 Focus Definition input → shortcut affects Definition only  
T-PY-16 Press Alt+P outside inputs → no change  
T-PY-17 IME composition active → no text corruption

---

## 6) Open Question (choose default if not answered)
- Do you want **Alt+P** (recommended) or **Ctrl+Alt+P** (even fewer collisions)?
Default: **Alt+P**.
