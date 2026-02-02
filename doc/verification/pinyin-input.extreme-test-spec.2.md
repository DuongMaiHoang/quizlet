# Pinyin Input v1 + v1.1 + v1.2 — Extreme E2E Test Spec

**Version**: v1-test-spec.2  
**Doc language**: English  
**UI copy/labels**: Vietnamese-only  
**Status**: POST-IMPLEMENTATION test spec  
**Purpose**: Exhaustively test Pinyin input support including mixed-field scenarios, full token matrix, and edge cases.

---

## 0) Preconditions / Execution Modes

### 0.1 Preconditions
- App running: `http://localhost:3000`
- Chrome DevTools connected on port 9222
- Clean browser session (temp profile)
- Optional shortcut: `Alt+P` (v1.1)
- Conversion triggers: **Space** and **Blur** per v1
- Per-field toggle behavior: **per-field** (Term and Definition independent)

### 0.2 Toggle Model
- **Implemented**: Per-field toggle
- Each input (Term/Definition) maintains its own `pinyinEnabled` state
- Alt+P toggles only the currently focused field
- No cross-field leakage

---

## 1) Core Token Matrix (must be used in all tests)

### 1.1 Basic syllables
| Input | Expected |
|-------|----------|
| ma1 | mā |
| ma2 | má |
| ma3 | mǎ |
| ma4 | mà |
| ma5 | ma |

### 1.2 Common syllables
| Input | Expected |
|-------|----------|
| ni3 | nǐ |
| hao3 | hǎo |
| wo3 | wǒ |
| shi4 | shì |
| zhong1 | zhōng |
| guo2 | guó |

### 1.3 Tone placement: a/e priority
| Input | Expected | Notes |
|-------|----------|-------|
| xian3 | xiǎn | contains a → tone on a |
| mei3 | měi | contains e → tone on e |
| shui3 | shuǐ | last vowel rule |
| gui4 | guì | last vowel rule |

### 1.4 ou rule
| Input | Expected |
|-------|----------|
| dou4 | dòu |
| kou3 | kǒu |
| zou1 | zōu |

### 1.5 ü handling (v / u: / ü) — CRITICAL
| Input | Expected |
|-------|----------|
| nv3 | nǚ |
| nu:3 | nǚ |
| nü3 | nǚ |
| lv4 | lǜ |
| lu:4 | lǜ |

### 1.6 Multi-syllable (space separated)
| Input | Expected |
|-------|----------|
| ni3 hao3 | nǐ hǎo |
| zhong1 guo2 | zhōng guó |
| wo3 ai4 ni3 | wǒ ài nǐ |

---

## 2) HARD MIXED-FIELD SCENARIOS

### Group H1 — Term Chinese (OFF) + Definition Pinyin (ON)

**H1-01 Basic Mixed**
- Given Create Set screen is open
- And focus in Term input
- When Pinyin mode is OFF (default)
- And user types Chinese Han text in Term: `汉字`
- Then Term remains `汉字` (no conversion, no corruption)
- When user moves to Definition input
- And toggles Pinyin mode ON (via Alt+P)
- And types token `ni3` then Space
- Then Definition becomes `nǐ `
- And Term still remains `汉字`

**H1-02 Token Matrix Loop**
- Repeat H1-01 setup (Term Chinese OFF, Definition ON)
- In Definition field, test each token in Core Token Matrix (Section 1)
- Expected: every token converts correctly when ON
- Test tokens: ma1-5, ni3, hao3, wo3, shi4, zhong1, guo2, xian3, mei3, shui3, gui4, dou4, kou3, zou1, nv3, nu:3, nü3, lv4, lu:4, ni3 hao3, zhong1 guo2, wo3 ai4 ni3

**H1-03 Multi-syllable + blur**
- Definition ON
- Paste `ni3 hao3` in Definition
- Blur field (click outside)
- Expected: `nǐ hǎo`

**H1-04 ü Critical Cases**
- Definition ON
- Test: `nv3` Space → `nǚ `
- Test: `nu:3` Space → `nǚ `
- Test: `lv4` Space → `lǜ `
- Fail these = FAIL feature

### Group H2 — Swap: Term Pinyin (ON) + Definition Chinese (OFF)

**H2-01 Basic Swap**
- Given Create Set open
- When user toggles Pinyin ON in Term (Alt+P)
- Types `zhong1 guo2` then blur
- Then Term becomes `zhōng guó`
- When user toggles Pinyin OFF in Definition (Alt+P)
- Types Chinese `学习`
- Then Definition remains `学习` and is not altered
- And Term still remains `zhōng guó`

**H2-02 Token Matrix Loop**
- Repeat H2-01 but Term tests each token in Core Token Matrix
- Definition remains Chinese `学习` throughout

### Group H3 — Toggle Switching Mid-Field

**H3-01 Toggle ON After Typing**
- Term OFF (default)
- Type `ni3` (should remain `ni3`)
- Toggle ON (Alt+P)
- Press Space
- Expected: converts `ni3` → `nǐ ` (conversion on space should convert current token)

**H3-02 Toggle OFF After Conversion**
- Term ON
- Type `ni3` + Space → `nǐ `
- Toggle OFF (Alt+P)
- Type `hao3` + Space
- Expected: stays `hao3 ` (no conversion)

**H3-03 Toggle ON/OFF Multiple Times**
- Term: Toggle ON → type `ma1` Space → `mā `
- Toggle OFF → type `ma2` Space → `ma2 ` (no conversion)
- Toggle ON → type `ma3` Space → `mǎ `
- Verify no state leakage

### Group H4 — Cross-Field Leakage Check

**H4-01 Per-Field Independence**
- Term ON, Definition OFF
- Type `ni3` Space in Term → `nǐ `
- Type `ni3` Space in Definition → `ni3 ` (no conversion)
- Verify Term and Definition states are independent

**H4-02 Focus Switch**
- Term ON
- Type `ma1` Space in Term → `mā `
- Focus Definition (OFF)
- Type `ma1` Space in Definition → `ma1 ` (no conversion)
- Focus Term again
- Type `ma2` Space in Term → `má ` (still ON)

### Group H5 — Undo + Chinese Unaffected

**H5-01 Undo After Conversion**
- In Definition with Pinyin ON:
  - Type `nv3` + Space → `nǚ `
  - Ctrl+Z should revert to `nv3 ` (or prior state)
- In Term with Chinese OFF:
  - Ensure Chinese text `汉字` remains unchanged after undo operations in Definition

**H5-02 Undo Multiple Conversions**
- Definition ON
- Type `ni3 hao3` + Space → `nǐ hǎo `
- Ctrl+Z → should revert appropriately
- Verify no data loss

---

## 3) Edge Cases & Non-Conversion

### Group E1 — Invalid Tokens

**E1-01 Invalid Patterns**
- Pinyin ON
- Type `abc9` → should remain `abc9` (tone 9 invalid)
- Type `ni0` → should remain `ni0` (tone 0 invalid)
- Type `2026` → should remain `2026` (numbers only)

**E1-02 Punctuation Boundaries**
- Pinyin ON
- Type `ni3,` → should remain `ni3,` (no conversion, punctuation attached)
- Type `ni3 ,` → should convert to `nǐ ,` (space separates)

### Group E2 — IME Composition Safety

**E2-01 IME During Composition**
- Pinyin ON
- Start IME composition (type Chinese)
- During composition, Alt+P should not corrupt text
- After composition ends, verify text is intact

**E2-02 IME + Pinyin Mix**
- Pinyin ON
- Type Chinese via IME: `你好`
- Then type `ni3` Space → `nǐ `
- Final: `你好 nǐ ` (both preserved)

### Group E3 — Space and Blur Triggers

**E3-01 Space Trigger**
- Pinyin ON
- Type `ma1` (no space yet) → remains `ma1`
- Press Space → converts to `mā `

**E3-02 Blur Trigger**
- Pinyin ON
- Type `ma1` (no space)
- Click outside (blur) → converts to `mā`

**E3-03 Multiple Tokens Blur**
- Pinyin ON
- Paste `ni3 hao3` (no spaces typed)
- Blur → converts to `nǐ hǎo`

---

## 4) Keyboard Shortcut Tests (v1.1)

### Group K1 — Alt+P Toggle

**K1-01 Basic Toggle**
- Focus Term input
- Alt+P → toggles ON, toast shows "Pinyin: BẬT"
- Alt+P → toggles OFF, toast shows "Pinyin: TẮT"

**K1-02 Per-Field Toggle**
- Focus Term → Alt+P (ON)
- Focus Definition → Alt+P (ON, independent)
- Verify both fields can have different states

**K1-03 Outside Input**
- Focus outside inputs (e.g., title field)
- Alt+P → no effect (no toggle, no toast)

**K1-04 IME Safety**
- Start IME composition in Term
- Alt+P → should not interrupt composition
- After composition ends, toggle should apply

---

## 5) Pass/Fail Criteria

### Critical (Must PASS)
- ✅ All ü cases (nv3, nu:3, lv4) must convert correctly
- ✅ Tone 5 (ma5 → ma) must remove tone number
- ✅ No conversion when Pinyin mode is OFF
- ✅ Per-field independence (Term ON, Definition OFF works correctly)
- ✅ Chinese text must never be corrupted by Pinyin conversion
- ✅ Space and Blur triggers work correctly

### Important (Should PASS)
- ✅ All Core Token Matrix conversions
- ✅ Tone placement rules (a > e > ou > last vowel)
- ✅ Multi-syllable conversion
- ✅ Undo works reasonably
- ✅ Alt+P shortcut works per-field

### Nice to Have
- Punctuation boundary handling
- IME composition safety

---

## 6) Reporting Template

For each test:
- **Test ID**: (e.g., H1-01)
- **Status**: PASS / FAIL / BLOCKED
- **Steps**: Exact reproduction steps
- **Expected**: Expected result
- **Actual**: Actual result
- **Screenshot**: (if FAIL)
- **Root Cause**: (if FAIL)
- **Fix**: (if FAIL, then fixed)

---

## 7) Execution Order

1. **Setup**: Start Chrome DevTools, navigate to Create Set
2. **H1 Group**: Term Chinese + Definition Pinyin
3. **H2 Group**: Term Pinyin + Definition Chinese
4. **H3 Group**: Toggle switching
5. **H4 Group**: Cross-field leakage
6. **H5 Group**: Undo
7. **E1-E3 Groups**: Edge cases
8. **K1 Group**: Keyboard shortcuts

---

END OF TEST SPEC

