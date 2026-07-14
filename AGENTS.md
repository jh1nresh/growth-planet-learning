# Oshiami repository instructions

## Product boundary

- Parents authenticate with Privy; children use first-party subprofiles with an alias, allow-listed avatar, and 4-digit PIN. Children never need their own email.
- Never request a child email, legal name, voice, location, school, or birthday.
- Guest mode must remain fully playable when Privy is not configured.
- Guest progress remains device-local and must never be uploaded without an explicit import flow.
- Authenticated child progress may sync through same-origin server APIs. Never expose a Supabase secret to the browser or trust a client-supplied parent ID.
- A child PIN is only valid on a device previously approved by a verified parent; store only salted hashes and rate-limit attempts.
- The imported Marble graph remains Mathematics and English only for topics whose `ageRangeEnd` is 12 or below.
- Chinese Language Arts is a first-party Oshiami curriculum extension. Keep its source locators and never attribute it to Marble.

## Curriculum boundary

- Preserve Marble Skill Taxonomy’s topic, evidence, standards, and dependency fields in the filtered dataset.
- Keep the upstream commit, filter, attribution, and license files with every imported snapshot.
- Keep the dependency graph acyclic and validate referential integrity with `npm run validate:taxonomy`.
- Preserve attribution in `THIRD_PARTY_NOTICES.md`, `docs/taxonomy-reference.md`, and the in-app credits.

## Engineering boundary

- Prefer native browser APIs and existing dependencies.
- Do not add a router, global state library, animation library, backend framework, wallet stack, or analytics SDK without a demonstrated need.
- The WebGL canvas must have equivalent HTML controls and content.
- Use on-demand rendering and cap device pixel ratio. No unbounded animation loop.
- All interactive controls need accessible names and visible focus.
- Respect reduced motion and reduced transparency.
- Pin dependencies and commit the lockfile.

## Verification

Run before commit or deployment:

```bash
npm run check
npm audit --audit-level=high
```

Browser verification must cover all three subject switches across Today, Growth, and Parent views; each starter lesson and its evidence; recommendation-to-lesson consistency; speech-unavailable fallback; Pixi mount/unmount cleanup; Privy guest fallback; 390 x 844, 768 x 1024, and 1440 x 900 overflow; keyboard equivalents; and console errors.
