# Auth & First-time Onboarding — UX Copy & Micro-interaction Specification

**Document type**: UX Copy + Interaction Rules (MANDATORY APPENDIX)  
**Audience**: Frontend engineers + AI coding agents  
**Target users**: Vietnamese students (non-technical), some teachers  
**Language**: English (simple, friendly). Vietnamese localization can be layered later.  

This document defines:
- Exact UI text (labels, helper text, errors)
- Loading / disabled / retry behavior
- Micro-interactions that affect perceived UX quality

This document **OVERRIDES any inferred or generated wording**.

---

## 1) Global Principles (MUST FOLLOW)

1. **Friendly, not technical**
   - ❌ OAuth, token, redirect, session
   - ✅ “Continue”, “Try again”, “Something went wrong”

2. **Short sentences**
   - One idea per sentence
   - Max 12–14 words per line if possible

3. **No blame**
   - ❌ “Invalid input”
   - ✅ “That doesn’t look right”

4. **Inline feedback first**
   - Prefer inline error over toast or modal
   - Toast only for global success/failure

---

## 2) Login Entry (Landing / Auth Entry)

### 2.1 Primary CTA

**Button**
```
Continue with Google
```

**Behavior**
- Shows Google logo
- Disabled while OAuth popup is opening
- Spinner inside button while loading

---

### 2.2 OAuth Failure / Cancel

**Inline error (below button)**
```
Something went wrong. Please try again.
```

**Retry CTA**
```
Try again
```

**Rules**
- No technical reason shown
- Error disappears on next interaction

---

## 3) Birthday Screen — Copy & Interaction

### 3.1 Title & Helper

**Title**
```
When’s your birthday?
```

**Helper text**
```
We use this to personalize your experience.
```

---

### 3.2 Inputs

**Month dropdown**
- Placeholder: `Month`

**Day dropdown**
- Placeholder: `Day`

**Year dropdown**
- Placeholder: `Year`

---

### 3.3 Continue Button

**Label**
```
Continue
```

**Disabled state**
- Disabled until all 3 fields selected
- Cursor: not-allowed
- No tooltip needed

---

### 3.4 Validation Errors (Inline, under inputs)

**Missing fields**
```
Please select your birthday.
```

**Invalid date**
```
That doesn’t look like a real date.
```

**Future date**
```
Your birthday can’t be in the future.
```

---

### 3.5 Loading State (after Continue)

- Continue button becomes disabled
- Inline spinner inside button
- No full-screen loader

---

## 4) Role Selection — Copy & Interaction

### 4.1 Section Title

```
Tell us about yourself
```

---

### 4.2 Student (Default)

**Label**
```
I’m a student
```

**Behavior**
- Selected by default
- Cannot be unselected (radio-style)

---

### 4.3 Teacher Option (Age ≥ 18 only)

**Checkbox label**
```
I’m a teacher
```

**Helper text (small, muted)**
```
For educators creating study materials.
```

**Rules**
- If age < 18:
  - Teacher option is hidden entirely
  - No placeholder, no disabled state shown

---

## 5) Profile Completion (Username)

### 5.1 Title

```
Your account is almost ready
```

---

### 5.2 Username Field

**Label**
```
Username
```

**Value**
- Auto-generated
- Read-only

**Helper text**
```
You can change this later.
```

---

### 5.3 Primary CTA

**Button**
```
Sign up
```

---

### 5.4 Loading State (Sign up)

- Button disabled immediately
- Inline spinner
- Prevent double click

---

### 5.5 Error (Profile creation failed)

**Inline error (above button)**
```
We couldn’t finish setting up your account. Please try again.
```

**Retry behavior**
- State preserved (birthday, role, username)
- No data loss

---

## 6) Resume Onboarding Copy

### 6.1 Resume Banner (Optional, top of screen)

```
Let’s finish setting up your account.
```

**Subtext**
```
It’ll only take a moment.
```

---

## 7) Profile Menu (Logged-in)

### 7.1 Header

- Avatar
- Username (bold)
- Email (muted)

---

### 7.2 Actions

**Logout**
```
Log out
```

---

## 8) Logout Confirmation (If needed)

> Prefer **NO confirmation modal**.  
If required by product later, use:

**Message**
```
Are you sure you want to log out?
```

**Buttons**
```
Cancel | Log out
```

---

## 9) Global Error (Fallback)

Use only when error cannot be tied to a specific field.

**Toast / Banner**
```
Something went wrong. Please try again.
```

---

## 10) Micro-interaction Summary (Checklist)

- Buttons:
  - Disabled immediately on submit
  - Spinner inside button (not page-level)
- Errors:
  - Inline first
  - Clear on user input
- Navigation:
  - No sudden jumps
  - Preserve scroll & focus where possible
- Animations:
  - Optional, subtle (fade/slide ≤ 150ms)

---

## 11) Explicit Don’ts (VERY IMPORTANT)

- ❌ No “Invalid”, “Error code”, “401”, “OAuth”
- ❌ No blocking modal for simple validation
- ❌ No surprise redirects without context
- ❌ No silent failure

---

**END OF COPY & MICRO-INTERACTION SPEC**
