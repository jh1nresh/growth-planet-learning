# Verification receipt

## Automated

- `npm run validate:taxonomy`: 698 Marble topics and 1,326 dependencies; filter and references valid; dependency graph is a DAG.
- `npm run test`: 8 files, 29 tests passed, including import accessors, graph layout, subject filters, and graph interaction helpers.
- `npm run build`: TypeScript and Vite production build passed.
- `npm audit --audit-level=high`: zero known vulnerabilities after pinned Privy-compatible Solana peers and dependency overrides.

## Browser

- The WebGL graph was visible and drag rotation changed its viewpoint.
- Hover and click exposed topic identity, evidence, direct prerequisites, and unlocks.
- Mathematics-only filtering changed the visible count from 698 to 446; reselecting a cross-subject relation restores its subject.
- The native concept selector provides a keyboard path to every currently visible topic.
- Desktop and mobile layouts had no horizontal page overflow.
- The graph is lazy-loaded; WebGL failure/context loss leaves the native selector and detail content available.

## Human boundary

Privy login code is present but cannot be live-tested until `VITE_PRIVY_APP_ID` and the allowed production origin are supplied. Guest learning remains intentionally complete and local-only.

## Production

- `https://growth-planet-learning.vercel.app/` returned HTTP 200 with the expected security headers.
- Browser read-back found the production canonical, WebGL canvas, 8 Math regions, correct title/H1, guest state, and zero console errors.
