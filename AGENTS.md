# Growth Planet repository instructions

## Product boundary

- Parents authenticate; children use a nickname-only local profile.
- Never request a child email, legal name, voice, location, school, or birthday.
- Guest mode must remain fully playable when Privy is not configured.
- Progress is device-local in v1. Do not imply cross-device sync.
- The main learning surface is the Marble-derived Mathematics and English graph for topics whose `ageRangeEnd` is 12 or below.

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

Browser verification must cover 3D drag/pan/zoom, Mathematics and English filters, topic details and relation navigation, the keyboard concept selector, WebGL fallback, Privy fallback state, mobile overflow, and console errors.
