# Verification receipt — Three-subject learning studios

Scope: issue #13 on `feat/three-subject-learning-studios`. This receipt is local and does not claim that the branch has been merged or deployed.

## Automated

- `npm run validate:taxonomy`: 21 local topics, 20 dependencies, 10 clusters, 9 missions, and an acyclic graph; the Chinese extension contains exactly 3 topics and 2 internal dependencies.
- Marble boundary: 698 Mathematics and English topics and 1,326 dependencies remain valid and unchanged in scope.
- `npm run test`: 16 files and 72 tests passed, including v3-to-v4 progress migration, three subject paths, deterministic Chinese evidence, and one-event-per-Math-topic evidence.
- `npm run build`: TypeScript and Vite production build passed. The existing large Privy/core chunk warning remains non-blocking.
- `npm audit --audit-level=high`: zero vulnerabilities.
- `git diff --check`: passed.

## Browser

- English, Mathematics, and Chinese Language Arts switch correctly across Today, Growth, and Parent views while lesson mode stays focused.
- CAT, the 34 place-value lesson, and the Zhuyin lesson were completed through visible controls. Mathematics returned with all three observed abilities mastered and unmounted without the former Pixi text-texture destruction error.
- English completion now recommends sight words without opening CAT again; the unavailable next lesson is shown as preparing instead of a misleading button.
- Hard dependencies keep lock language; soft dependencies show `可先探索` and `建議前置` without a lock icon.
- In a browser with no speech synthesis API, `播放 CAT` and `播放「米」` each unlocked all three visible controls and both lessons remained playable from text.
- Home, Growth, and Parent views mount no Canvas/WebGL surface.
- 390 x 844, 768 x 1024, and 1440 x 900 had no horizontal overflow. At 390 x 844, the 114.4 px header and primary lesson action remained inside the first viewport.
- A fresh Mathematics lesson enter/update/leave pass ended with zero console errors.
- Title, description, canonical, Open Graph, Twitter card, favicon, and manifest now use the three-studio identity; the new social card is 1200 x 630 and the app icon is 512 x 512.
- Native buttons, links, and `details` retain keyboard semantics; a visible focus outline was measured after button focus. The browser automation layer did not advance focus with its Tab command, so sequential keyboard traversal remains a manual merge check.

## Boundaries

- Chinese curriculum alignment is provisional pending Taiwan lower-primary classroom review; topic grouping, dependency strength, sample word, and pacing are product interpretations.
- Browser speech is optional playback, not recorded learning evidence.
- Privy live login still requires a configured `VITE_PRIVY_APP_ID` and allowed origin. Guest learning remains complete and local-only.
- China Simplified Chinese and Pinyin content remain out of scope for this change.
- The social card cannot be checked by a public share debugger until this PR is deployed.
