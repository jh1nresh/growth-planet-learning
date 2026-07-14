# [P0] Privy family accounts with child PIN profiles and cloud progress

## PM Gate

- **Repo:** `JhiNResH/growth-planet-learning`
- **Problem:** Privy is hidden inside the learner dialog and only represents a parent session. A child is currently a device-local nickname, so siblings cannot keep separate progress and no progress follows the child across approved devices.
- **Goal:** A parent signs in with Privy, creates child subprofiles without child email, approves a shared device, and lets each child unlock their own profile with a 4-digit PIN. Learning progress syncs per child while guest mode remains local and fully playable.
- **Acceptance criteria:**
  - The signed-out home exposes a visible parent sign-in action when Privy is configured.
  - A verified Privy parent can create, rename, switch, and delete child profiles.
  - Child profiles collect only an alias, an allow-listed avatar, and a server-hashed 4-digit PIN.
  - A parent-authenticated browser becomes an approved device; a child can later select a profile and enter its PIN without using email.
  - A successful PIN creates a revocable, opaque child session in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie in production.
  - Progress is stored once per child, uses the existing `ProgressState` data shape, and synchronizes across approved devices.
  - Server ownership always comes from a verified Privy access token or a hashed child/device session, never a client-supplied parent ID.
  - Parent deletion removes the child profile, progress, and child sessions.
  - Guest progress remains local and is not silently uploaded or merged.
  - Existing English, Mathematics, and Chinese lesson, Growth, and Parent views keep working.
- **Verification:** Unit tests for validation, PIN hashing, cookie/session parsing, ownership, progress version conflicts, and guest fallback; `npm run check`; `npm audit --audit-level=high`; Supabase security/performance advisors; desktop/mobile browser flow and console checks.
- **Harness:** React/Vite client, Vercel Functions on the same origin, Supabase Postgres, Privy access-token verification against the app JWKS, Vitest, browser QA.
- **State surface:** `src/features/auth`, new family UI/hook/client, existing progress hook/store, Vercel API handlers, server auth/session/database helpers, SQL migration, environment docs.
- **Execution surface:** local tests/build/audit, Vercel preview, Supabase migration/advisors, production canary after approved provisioning.
- **Feedback signals:** deterministic tests, TypeScript build, database constraints/advisors, browser read-back, structured security review.
- **Convergence condition:** All checks pass; a parent can create a child, unlock it through PIN on an approved device, complete a lesson, reload and retrieve that child's progress; another parent cannot access it; guest flow remains unchanged.
- **Human boundary:** Creating the Supabase project and accepting its price requires explicit organization/cost confirmation. Production environment secrets, merge, and deployment use the user's explicit approval for this family-account release.
- **Risk:** Authentication, under-13 privacy, credential leakage, brute-force PIN attempts, stale concurrent progress writes, destructive deletion, and accidental guest-progress upload.
- **Security scan receipt:** Required. Run dependency audit, independent auth/data-path review, database advisors, and a changed-diff security scan before ship.
- **Work type:** Feature.
- **Dynamic harness mode:** Adversarial; implementation must be challenged against token spoofing, cross-household reads, PIN brute force, session theft, and CSRF.
- **Context risk:** Monitor; keep Privy/Supabase credentials outside source and agent handoffs.
- **Product decision frame:** Parent Privy identity plus first-party child subprofiles and approved-device PIN sessions. Reject direct child Email/Google accounts and reject nickname-only local storage as the final account model.
- **Complexity gate:** Use existing Privy React auth, Web-standard Vercel handlers, Node crypto, and one small family API. Add only the database client and JWT verifier needed at the server trust boundary.
- **Out of scope:** Child email, legal name, birthday, school, voice, location, social features, teacher accounts, payments, analytics, AI-generated content, household invitations, and automatic guest-progress merging.
- **Do not touch:** Curriculum graph/content, Marble snapshot/provenance, lesson mechanics, 3D experiments, legacy local-storage key.
- **Suggested labels:** `P0`, `auth`, `family`, `privacy`, `backend`
- **Owner:** JhiNResH

## Proposed request flow

```text
Privy parent access token
  -> Vercel Function verifies issuer, audience, signature, expiry
  -> parent household/profile operations
  -> approved-device opaque cookie
  -> child profile + PIN verification
  -> opaque child-session cookie
  -> child-scoped progress GET/PUT
```

The browser never receives a Supabase secret key, PIN hash, device-token hash, child-session hash, or another household's rows.
