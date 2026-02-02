# Pinyin Input v1 — Extreme E2E Test Spec (v1-test-spec.2)

**Version**: v1-test-spec.2 (append)  
**Doc language**: English  
**UI copy/labels**: Vietnamese-only  
**Status**: PRE-IMPLEMENTATION test spec (use after feature is implemented; before that, expect FAIL/BLOCKED)

**Purpose**: Add “hard” mixed-input scenarios:
- Term field contains Chinese characters (Han) while Pinyin mode is OFF
- Definition field uses Latin pinyin conversion while Pinyin mode is ON
- Then swap (Definition Chinese / Term pinyin)
- Run across full pinyin token matrix (ni3, nv3, nu:3, lv4, multi-syllable, tone 5, etc.)
- Ensure no cross-field leakage of toggle state and no accidental conversion when OFF.

---

## 0) Preconditions / Execution Modes

### 0.1 If feature NOT implemented yet (current state)
- Expected result: tests are **BLOCKED** or **FAIL**.
- Tester must still run and produce a report listing failures clearly.
- Do not “assume pass”.

### 0.2 When feature is implemented
- App running: `http://localhost:3000`
- Optional shortcut: `Alt+P` (if added)
- Conversion triggers: **Space** and **Blur** per v1
- Per-field toggle behavior:
  - If spec says per-field, enforce per-field
  - If global, enforce global (must be consistent and documented)

---

## 1) Core Token Matrix (must be used in mixed-field tests)

### 1.1 Single syllables
- `ni3` → `nǐ`
- `hao3` → `hǎo`
- `ma1` → `mā`
- `ma2` → `má`
- `ma3` → `mǎ`
- `ma4` → `mà`
- `ma5` → `ma`

### 1.2 ü cases (critical)
- `nv3` → `nǚ`
- `nu:3` → `nǚ`
- `nü3` → `nǚ`
- `lv4` → `lǜ`
- `lu:4` → `lǜ`

### 1.3 ou rule
- `dou4` → `dòu`
- `kou3` → `kǒu`
- `zou1` → `zōu`

### 1.4 Multi-syllable (space separated)
- `ni3 hao3` → `nǐ hǎo`
- `zhong1 guo2` → `zhōng guó`
- `wo3 ai4 ni3` → `wǒ ài nǐ`

---

## 2) HARD MIXED-FIELD SCENARIOS (NEW)

### Group H1 — Term Chinese (OFF) + Definition Pinyin (ON)
**H1-01**
Given Create Set screen is open  
And focus in Term input  
When Pinyin mode is OFF  
And user types Chinese Han text in Term: `汉字`  
Then Term remains `汉字` (no conversion, no corruption)

When user moves to Definition input  
And toggles Pinyin mode ON (via UI toggle or Alt+P if supported)  
And types token `ni3` then Space  
Then Definition becomes `nǐ `  
And Term still remains `汉字`

**H1-02 (Token Matrix Loop)**
Repeat H1-01 but in Definition field, test each token in the Core Token Matrix (Section 1).
Expected: every token converts correctly when ON.

**H1-03 (Multi-syllable + blur)**
Definition ON  
Paste `ni3 hao3`  
Blur field  
Expected: `nǐ hǎo`

### Group H2 — Swap: Term Pinyin (ON) + Definition Chinese (OFF)
**H2-01**
Given Create Set open  
When user toggles Pinyin ON in Term  
Types `zhong1 guo2` then blur  
Then Term becomes `zhōng guó`

When user toggles Pinyin OFF in Definition  
Types Chinese `学习`  
Then Definition remains `学习` and is not altered

**H2-02 (Token Matrix Loop)**
Repeat H2-01 but Term tests each token in Core Token Matrix.

### Group H3 — Toggle switching mid-field without losing content
**H3-01**
Term OFF  
Type `ni3` (should remain `ni3`)  
Toggle ON  
Press Space  
Expected: converts `ni3` → `nǐ ` (conversion on space should convert current token)

**H3-02**
Term ON  
Type `ni3` + Space → `nǐ `  
Toggle OFF  
Type `hao3` + Space  
Expected: stays `hao3 ` (no conversion)

### Group H4 — Cross-field leakage check (important)
**H4-01 (per-field expected)**
If design is per-field:
- Term ON, Definition OFF:
  - Term converts, Definition does not

**H4-02 (global expected)**
If design is global:
- Term ON => Definition also ON automatically (and vice versa)
- Must be consistent; report mismatch.

### Group H5 — Undo + Chinese unaffected
**H5-01**
In Definition with Pinyin ON:
- type `nv3` + Space → `nǚ `
- Ctrl+Z should revert to `nv3 ` (or prior state)
In Term with Chinese OFF:
- ensure Chinese text remains unchanged after undo operations in Definition

---

## 3) Pass/Fail Criteria
- All H1/H2 token conversions must PASS when ON.
- Any conversion occurring when OFF is an automatic FAIL.
- Term Chinese text must never be corrupted by pinyin conversion in Definition.
- Cross-field toggle behavior must match the intended spec (per-field or global) consistently.

---

## 4) Reporting Template Requirements
Report MUST include:
- Which toggle model is implemented: per-field or global
- For each token case:
  - expected vs actual
- For each failure:
  - exact reproduction steps
  - screenshot of the field values
  - whether failure is due to missing feature vs bug

