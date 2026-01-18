# Authentication & Onboarding — ENTRY DOCUMENT (READ FIRST)

⚠️ **CRITICAL**
This file is the **single entry point** for all Authentication & First-time Onboarding requirements.

Any AI, developer, or reviewer MUST read this file first.
Skipping this file is considered an incorrect implementation.

---

## 1) Purpose of This Document

This document defines:

- Which document is the **primary source of truth**
- Which documents are **mandatory appendices**
- How conflicts between documents must be resolved
- How AI must behave if a document is missing or unclear

This file itself does NOT define UI or business logic.  
It defines **how to read and apply the rest of the documents safely**.

---

## 2) Folder Scope

This folder defines **ALL requirements** for:

- Login via Google
- Signup via Google
- First-time onboarding
- Birthday & age gating
- Student / Teacher role logic
- Vietnam-only locale & timezone handling
- Validation, anti-break, anti-abuse behavior
- UX copy & micro-interactions
- Mandatory E2E tests

No document outside this folder overrides its scope.

---

## 3) Document Authority & Reading Order (NON-NEGOTIABLE)

### 3.1 Primary Source of Truth

**File**
```
auth-login-signup.md
```

This document defines:
- Core flows
- State transitions
- Screens & navigation
- Business rules
- Mermaid diagrams

All implementation MUST start from this document.

---

### 3.2 Mandatory Appendices (ALL MUST BE READ)

After reading the primary document, the following files are **MANDATORY**:

1. **auth-login-signup.copy-microinteraction.md**  
   - Defines **exact UI copy**
   - Defines loading, disabled, error, empty states
   - OVERRIDES any inferred text

2. **auth-login-signup.validation-flow.md**  
   - Defines validation & anti-break rules
   - Covers invalid input, abuse attempts, bypass attempts
   - OVERRIDES permissive logic

3. **auth-login-signup.locale-timezone-vn.md**  
   - Defines Vietnam-only timezone logic
   - Governs age calculation & birthday boundaries
   - OVERRIDES browser or server timezone assumptions

4. **auth-login-signup.anti-bot-abuse-vn.md**  
   - Defines lightweight anti-abuse (NO CAPTCHA)
   - Must NOT degrade UX
   - OVERRIDES permissive UX behavior

5. **auth-login-signup.e2e-playwright.md**  
   - Defines mandatory E2E test coverage
   - Missing tests = incomplete implementation

---

## 4) Conflict Resolution Rules

If conflicts exist between documents, resolve in this order:

1. **Validation & Locale docs** override all others
2. **UX Copy doc** overrides inferred wording
3. **Anti-bot / Abuse doc** overrides permissive behavior
4. **Primary auth-login-signup.md** defines base flow

If a conflict cannot be resolved:
- STOP
- Report the conflict
- DO NOT guess

---

## 5) Missing Document Policy (CRITICAL)

If ANY document listed above is missing:

- ❌ DO NOT implement partially
- ❌ DO NOT infer missing behavior
- ❌ DO NOT invent UX or logic

Instead:
- STOP implementation
- Report which document is missing
- Wait for requirement completion

---

## 6) Assumption Policy (VERY IMPORTANT)

If a behavior, copy, validation rule, or edge case is NOT explicitly defined:

- ❌ DO NOT assume
- ❌ DO NOT infer
- ❌ DO NOT copy patterns from other apps

Instead:
- Block safely
- Or report missing requirement

---

## 7) Implementation Flow (How AI MUST Work)

```
1. Read README.md (this file)
2. Read auth-login-signup.md fully
3. Read and APPLY all appendices
4. Implement UI + logic + validation
5. Implement E2E tests
6. Verify against flows & business rules
```

Skipping any step is considered incorrect.

---

## 8) AI IMPLEMENTATION PROMPT (COPY & USE)

```text
You are implementing Authentication & First-time Onboarding.

MODEL:
- Claude Sonnet 4.5

IDE:
- Antigravity (browser testing enabled)

STEP 1:
Read README.md FIRST.
Do not proceed until document authority is understood.

STEP 2:
Read auth-login-signup.md as the PRIMARY source of truth.

STEP 3:
Read and APPLY ALL mandatory appendices listed in README.md.

STEP 4 — CONSTRAINTS:
- Google OAuth only
- Vietnam timezone ONLY (Asia/Ho_Chi_Minh)
- Default role = Student
- Teacher role allowed only if age >= 18 (VN local date)
- No CAPTCHA
- No assumptions if behavior is undefined

STEP 5 — IMPLEMENTATION:
- Follow Mermaid flows exactly
- Use exact UI copy from copy-microinteraction doc
- Block invalid & abusive behavior gracefully

STEP 6 — TESTING:
- Implement all E2E tests from auth-login-signup.e2e-playwright.md
- Use browser-based UI testing

STEP 7 — OUTPUT:
Report:
1) Files implemented
2) Test coverage summary
3) Missing or conflicting requirements (if any)

IMPORTANT:
If ANY required document is missing, STOP and report it.
DO NOT guess.
```

---

## 9) Final Note

This README exists to:
- Prevent AI from guessing
- Prevent partial implementation
- Ensure UX, logic, validation, and tests are aligned

Any implementation that ignores this file is incorrect.

---

**END OF ENTRY DOCUMENT**
