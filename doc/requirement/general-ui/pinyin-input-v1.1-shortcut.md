# Pinyin Input v1 — Extreme E2E Test Spec (Tone numbers → Tone marks)

**Version**: v1-test-spec  
**Doc language**: English  
**UI copy/labels**: Vietnamese-only  
**Purpose**: Exhaustively test pinyin conversion when Pinyin mode is ON, including edge cases like `ni3`, `nv3`, `nu:3`, mixed tokens, punctuation, spaces, undo, and keyboard shortcut toggling.

---

## 1) Preconditions
- App running at: `http://localhost:3000`
- Pinyin feature implemented per:
  - `doc/requirement/general-ui/pinyin-input-v1.md`
  - (If exists) shortcut append: `pinyin-input-v1.1-shortcut.md`
- Testing surfaces:
  - Create/Edit Set: Term input + Definition input (mandatory)
  - Bulk import textarea (only if implemented; else mark N/A)

---

## 2) Golden Rules (Expected Behavior)
When Pinyin mode is **ON**:
- Tokens matching `[letters]+[1-5]` convert on **Space** and on **Blur**
- `v` and `u:` and `ü` all treated as `ü`
- Tone placement rules:
  1) If contains `a` → tone on `a`
  2) Else if contains `e` → tone on `e`
  3) Else if contains `ou` → tone on `o`
  4) Else tone on last vowel
- Tone 5 removes mark (neutral)

When Pinyin mode is **OFF**:
- No conversion at all.

---

## 3) Test Data — Expected Conversions (Core)

### 3.1 Basic syllables
| Input | Expected |
|---|---|
| ma1 | mā |
| ma2 | má |
| ma3 | mǎ |
| ma4 | mà |
| ma5 | ma |

### 3.2 Common syllables
| Input | Expected |
|---|---|
| ni3 | nǐ |
| hao3 | hǎo |
| wo3 | wǒ |
| shi4 | shì |
| zhong1 | zhōng |
| guo2 | guó |

### 3.3 Tone placement: a/e priority
| Input | Expected | Notes |
|---|---|---|
| xian3 | xiǎn | contains a → tone on a |
| mei3 | měi | contains e → tone on e |
| shui3 | shuǐ | last vowel rule |
| gui4 | guì | last vowel rule |

### 3.4 ou rule
| Input | Expected |
|---|---|
| dou4 | dòu |
| kou3 | kǒu |
| zou1 | zōu |

### 3.5 ü handling (v / u: / ü)
| Input | Expected |
|---|---|
| nv3 | nǚ |
| nu:3 | nǚ |
| nü3 | nǚ |
| lv4 | lǜ |
| lu:4 | lǜ |

### 3.6 Multi-syllable (space-separated)
| Input | Expected |
|---|---|
| ni3 hao3 | nǐ hǎo |
| zhong1 guo2 | zhōng guó |
| wo3 ai4 ni3 | wǒ ài nǐ |

---

## 4) Edge Cases & Non-conversion

### 4.1 Invalid / should remain unchanged
| Input | Expected |
|---|---|
| abc9 | abc9 |
| ni0 | ni0 |
| 2026 | 2026 |
| id123 | id123 (unless pattern matches with tone digit at end) |

### 4.2 Punctuation boundaries (v1 recommended)
Convert tokens when separated by whitespace. If punctuation attached, behavior depends on implementation:
- Acceptable in v1:
  - `ni3,` remains `ni3,` (no conversion)
  - `ni3 ,` converts `nǐ ,`

Mark as PASS if consistent with v1 rules and documented.

### 4.3 Leading/trailing spaces
- Must preserve spaces.
- Conversion should not collapse existing spacing unless v1 spec says so.

---

## 5) UI/UX Scenario Tests (Term + Definition inputs)

### Group A — Toggle ON/OFF
**A01** Toggle ON in Term input → indicator shows ON  
**A02** Type `ni3` then press Space → becomes `nǐ `  
**A03** Toggle OFF → type `ni3` then Space → stays `ni3 `  
**A04** Toggle ON again → works again

### Group B — ü cases (critical)
**B01** Toggle ON → type `nv3` Space → must become `nǚ `  
**B02** Toggle ON → type `nu:3` Space → must become `nǚ `  
**B03** Toggle ON → type `lv4` Space → must become `lǜ `  
Fail these = FAIL feature.

### Group C — Multi-syllable + blur
**C01** Toggle ON → paste `ni3 hao3` then click outside (blur)  
Expected: `nǐ hǎo`  
**C02** Toggle ON → type `zhong1 guo2` (space in between)  
Expected: `zhōng guó`

### Group D — Undo / not corrupt input
**D01** After conversion, press Ctrl+Z → returns to original token  
**D02** Ensure no duplicated spaces inserted unexpectedly

### Group E — Definition field independence
**E01** If per-field toggle: Term ON, Definition OFF → verify independent behavior  
(If session-wide toggle, document that and verify consistent.)

### Group F — Shortcut (if implemented)
**F01** Focus Term → Alt+P toggles ON and shows toast  
**F02** Alt+P toggles OFF and shows toast  
**F03** Press Alt+P outside input → no effect

---

## 6) Pass/Fail Criteria
- All “Core conversion” tests in Section 3 must PASS in Term input.
- All B-group ü tests must PASS (nv3/nu:3/lv4).
- OFF mode must never convert.
- No data loss in undo scenario.

---

## 7) Evidence Collection
For each failing case:
- Record:
  - input text
  - exact steps
  - expected vs actual
  - screenshot of field content
- Include in report file.

