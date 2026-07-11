# Growth Planet repository instructions

## Product boundary

- Parents authenticate; children use a nickname-only local profile.
- Never request a child email, legal name, voice, location, school, or birthday.
- Guest mode must remain fully playable when Privy is not configured.
- Progress is device-local in v1. Do not imply cross-device sync.
- Math Continent v1 means the complete Taiwan Grade 1 vertical, not unverified K–6 filler.

## Curriculum boundary

- Follow Marble Skill Taxonomy’s architecture: micro-topics, evidence, standards, dependencies, and clusters.
- Use original Taiwan-focused IDs and content. Do not copy Marble IDs, descriptions, evidence, or standard text.
- Keep the dependency graph acyclic and validate referential integrity with `npm run validate:taxonomy`.
- Preserve attribution in `docs/taxonomy-reference.md` and the in-app credits.

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

Browser verification must cover the globe, every Math mission, the English starter mission, guest progress, Privy fallback state, keyboard controls, mobile overflow, reduced motion, and console errors.
