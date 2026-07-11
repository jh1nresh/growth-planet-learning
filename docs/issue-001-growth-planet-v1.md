# Issue: Build Growth Planet v1 — 3D Math Continent and English Port

## PM Gate

- Title: Growth Planet v1 — interactive 3D learning world
- Repo: `JhiNResH/growth-planet-learning` (new private GitHub repository)
- Problem: The current prototype proves the visual direction but is a static map with one lesson, no product repository, no scalable curriculum graph, no account integration, and no deployable product shell.
- Goal: Ship a production-oriented, deployed vertical slice where a child can rotate and zoom a 3D planet, enter Math Continent, complete the Taiwan Grade 1 math route, retain device progress, and begin the first English Port route; a parent can authenticate through Privy when configured.
- Acceptance criteria:
  - A real WebGL planet supports pointer/touch drag, wheel/pinch zoom, keyboard rotation/zoom, reset, and reduced-motion behavior.
  - The world preserves the selected Growth Planet art direction: deep space, warm gold, ocean teal, parchment, green Math Continent, and blue English Port.
  - Math Continent contains eight connected regions and playable missions covering counting, bundling ten, place value, comparison, addition/subtraction, shapes, measurement, and review.
  - English Port contains a visible starting route and at least one playable letter/sound mission.
  - Curriculum data uses original Taiwan-focused IDs/content while following Marble’s node, evidence, standards, dependency, and cluster architecture.
  - Parent login uses Privy email/Google when `VITE_PRIVY_APP_ID` is present; no child email is requested.
  - Guest mode remains usable and stores a versioned local device profile/progress without names, voice, analytics, or remote child data.
  - Desktop/tablet/mobile layouts have no primary-action clipping or horizontal overflow.
  - Production build, unit tests, browser flow, motion review, accessibility review, security scan, GitHub push, and Vercel production deployment pass.
- Verification: `npm run check`; browser interaction at 1440×900, 834×1194, and 390×844; console/network inspection; reduced-motion and keyboard checks; dependency audit; Vercel inspect/log scan.
- Harness: Vite + React + TypeScript; deterministic taxonomy validator and unit tests; in-app Browser; visual/motion QA; Vercel production receipt.
- State surface: curriculum JSON/TypeScript data, versioned local progress store, optional Privy session state, 3D camera/world state.
- Execution surface: npm scripts, browser, GitHub CLI, Vercel CLI.
- Feedback signals: typecheck/build/test output, taxonomy graph validation, WebGL screenshot/video evidence, browser console, dependency audit, structured review, deployed URL.
- Convergence condition: all acceptance criteria pass with no actionable P0/P1/P2 design issue, no blocking motion finding, no high dependency vulnerability, and production URL returns the verified app.
- Human boundary: Creating Privy apps/credentials or other security settings requires the user’s explicit project/app ID; no production child PII, payments, messages, or analytics. Vercel production deploy and private GitHub repo creation are explicitly authorized by the current request.
- Risk: WebGL performance on older mobile devices; auth misconfiguration; child privacy; curriculum scope ambiguity; third-party bundle size.
- Security scan receipt: required for dependencies, auth integration, local persistence, and public deployment.
- Skillification route: N/A; this is a product feature plus repo rails, not an unattended workflow.
- Work type: feature + repo rail.
- Loop receipt: N/A; the Growth Agent remains deterministic and user-triggered in v1.
- Dynamic harness mode: adversarial for auth/persistence/security review; local serial implementation because subagents were not authorized.
- Context risk / handoff trigger: checkpoint; repo-local brief, architecture, and verification receipts will hold stable decisions.
- Product decision frame: deliver a complete Grade 1 math continent as the first validated vertical, visibly reserve later grade regions, and start English Port with one route instead of filling K–6 with untested content.
- Project rails receipt: add repo-local instructions, README, check script, taxonomy validator, tests, security receipt, design QA, motion review, and deployment receipt.
- Complexity gate: one React/Vite app; React Three Fiber only for required 3D; Privy only for requested auth; no router, global state library, backend framework, analytics SDK, animation library, or wallet creation.
- Out of scope: complete Grades 2–6 content, AI-generated tutoring, payments, social features, child email, voice capture, teacher dashboard, analytics tracking, and cloud progress until a data service is explicitly approved.
- Do not touch: existing QA outputs and the Marble reference checkout.
- Suggested labels: `v1`, `3d`, `curriculum-graph`, `math`, `english`, `auth`, `vercel`.
- Owner: JhiNResH.
- Follow-up worker: N/A; local serial work.

## Harness metadata

- Model / provider: Codex / OpenAI.
- Harness version: founder-engineering-workflow 0.2.8; Product Design 0.1.50.
- Context loaded: selected orbital Growth Planet visual, Taiwan Grade 1 math adventure spec, multi-subject blueprint, Marble Skill Taxonomy v1 README/schema architecture, Privy current React docs.
- Environment: macOS, Node 22, authenticated GitHub and Vercel CLIs.
- Verifier shape: behavioral invariants + graph integrity + build/tests + browser interaction + visual/motion review + deployed production response.
- Reference policy: one fixed visual direction; multiple valid 3D implementation shapes are accepted if interaction, accessibility, performance, and world hierarchy invariants hold.
- Component signal: failures are attributed to spec, curriculum data, 3D implementation, auth provider/config, browser/WebGL tooling, dependency environment, Vercel deployment, or human credential boundary.

## Product decision frame

- Decision: Treat “complete Math Continent” as a complete Grade 1 learning journey, with later grades represented as future regions.
- Options considered: all K–6 content now; one Grade 1 vertical; static map with many cards.
- Chosen tradeoff: one deep, playable Grade 1 vertical plus scalable taxonomy.
- Rejected alternative: hundreds of shallow lesson stubs that cannot be validated with children.
- Expected outcome: a product that can be tested immediately while preserving the architecture for ages 4–12.
- Verification: every Math region opens a real mission and the route can reach a completion state.

## Motion and interaction harness

- Interaction / trigger: drag or swipe rotates the globe; wheel/pinch zooms; landmark selection focuses content; keyboard controls provide an equivalent path.
- Frequency: high for globe navigation, occasional for drawers/mission transitions.
- Purpose of motion: direct manipulation, spatial orientation, state feedback, and preventing jarring camera changes.
- Input matrix: pointer, touch, trackpad/wheel, keyboard.
- Reduced-motion expectation: no idle rotation or camera travel; instant focus with opacity-only UI feedback.
- Normal-speed evidence: recorded browser interaction or replayable browser checks.
- Slow/frame evidence: browser performance trace or short slow inspection for drag/zoom and landmark focus.
- Performance signal: on-demand rendering, capped device pixel ratio, no layout reads in the render loop, no long main-thread tasks during interaction.
- Motion checker: `review-animations` explicit pass/fail.

## Ponytail complexity gate

- Need exists: 3D globe, curriculum graph, auth adapter, and deploy rails are explicit requirements.
- Stdlib/native option: Pointer/wheel/keyboard semantics, localStorage, and browser reduced-motion are used directly where sufficient.
- Existing dependency option: React/Vite; Three.js through React Three Fiber; Privy for login.
- One-line/minimal option: impossible for the 3D interaction and auth boundary.
- Chosen smallest correct path: single-page application with feature modules and one data graph.
- What is deliberately skipped: router, state framework, server framework, wallet stack, cloud database, analytics, and speculative agent automation.
- Upgrade trigger: approve a cloud progress service after child testing demonstrates cross-device need.
- Safety not simplified: accessible alternative controls, versioned persistence, dependency pinning, no child email, no secret in client code, and explicit auth configuration boundary.
