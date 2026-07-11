# Design QA

- Source visual truth: `/Users/jhinresh/projects/growth-planet-learning/artifacts/reference-growth-planet.png`
- Browser-rendered implementation: `/Users/jhinresh/projects/growth-planet-learning/artifacts/implementation-visible-stage-postfix.png`
- Mobile focused evidence: `/Users/jhinresh/projects/growth-planet-learning/artifacts/implementation-mobile-postfix.png`
- Same-input comparison: `/Users/jhinresh/projects/growth-planet-learning/artifacts/design-qa-comparison.png`
- Rendered URL: `http://127.0.0.1:4173/`
- Viewport/state: CSS 805×452 tablet viewport, Mathematics selected, guest device progress 1/8; focused mobile pass at CSS 390×817.

## Findings

No actionable P0/P1/P2 finding remains.

- [P3] The source is a portrait, painterly orbital atlas while the implementation is a responsive product interface with a real-time low-poly globe. This is an intentional product constraint: the source is the art-direction truth, not a pixel clone. The implementation keeps the deep-space, warm-gold, teal-ocean, green-land, parchment-label hierarchy and uses the source artwork as the loading/fallback asset.

## Required fidelity surfaces

- Fonts and typography: Songti-style display text and PingFang/Noto/JhengHei UI fallbacks preserve the source's storybook/editorial contrast. Mobile title now fits on one line at 28px/30.24px in the measured 390px viewport.
- Spacing and layout rhythm: fixed left route, center world, right mission hierarchy on wide screens; two-column tablet; stacked mobile. Primary planet area measured 676px wide after the tablet fix, up from the incorrect 220px.
- Colors and visual tokens: space `#07111f`, gold `#e0b65f`/`#f3d781`, teal and green map directly to the reference palette; status colors remain distinguishable.
- Image quality and asset fidelity: original generated orbital atlas is retained at native 1048×1501 for loading/fallback and social preview. The live globe is intentionally procedural because direct 3D manipulation is the requested core experience.
- Copy and content: standalone Traditional Chinese copy explains the child task, time, energy reward, progress, guest privacy, and English Port scope without leaking build instructions.
- Icons: one Phosphor family is used for all product controls; text arrow glyphs were removed.
- Accessibility and states: visible focus, skip link, semantic route navigation, native dialogs, reduced motion/transparency/contrast preferences, loading, locked, available, correct, completed, and guest states are present.

## Full-view and focused comparison evidence

The combined 1800×720 comparison shows the shared orbital hierarchy and palette while making the intentional portrait-to-responsive change explicit. A focused mobile pass was required because the initial title wrapping could not be judged from the tablet view alone.

## Comparison history

1. Initial tablet capture: P1 — the globe rendered in the 220px route column. Fix: explicitly assigned route/world/panel grid columns and tablet panel row. Post-fix evidence measured a 676px planet area at the same runtime width.
2. Initial mobile capture: P2 — the heading wrapped to three lines and collided with 3D labels. Fix: changed the mobile heading to a 16rem measure at 28px and hid redundant pointer-only 3D labels on mobile. Post-fix evidence shows a single-line heading and clean globe.
3. Accessibility follow-up: the profile dialog inherited the mission dialog's accessible name because both used `modal-title`. Fix: each modal now receives a React `useId()` title ID. Browser read-back reports `dialog "探險家設定"`.

## Primary interactions tested

- 3D rotate control changed the captured world-region pixel hash.
- Complete both questions in the first Math mission; progress advanced from 0/8 to 1/8 and the second region changed from locked to available.
- English Port tab exposed its first playable mission.
- Guest profile saved a child nickname locally and closed correctly.
- Console: zero application errors; one upstream Three.js deprecation warning from a dependency.

Focused region comparison was used for mobile typography and modal labeling; no additional icon crop was needed because the full implementation capture renders the shared Phosphor set clearly at product size.

final result: passed
