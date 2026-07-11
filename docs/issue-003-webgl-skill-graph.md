# Issue: WebGL terrain Skill Graph

## PM Gate

- Title: Turn the illustrated Growth Planet into a real WebGL Skill Graph
- Repo: `JhiNResH/growth-planet-learning`
- Problem: The illustrated atlas has the right visual density, but its terrain is still a DOM image transformed with CSS; WebGL only draws stars and landmark rings, so the learning relationships do not yet exist as a spatial graph.
- Goal: Render the exact illustration on a curved WebGL surface and place taxonomy-derived 3D nodes and prerequisite paths above it without losing the authored artwork.
- Acceptance criteria:
  - The DOM `<picture>` terrain is removed from the live world; the illustrated desktop/mobile texture renders inside the WebGL canvas.
  - The atlas has visible real perspective under drag: the textured surface, nodes, and edges move together in 3D.
  - Math region edges are derived from topic prerequisites in the existing taxonomy data, deduplicated at region level, and covered by a deterministic test.
  - Eight Math landmarks render as raised, clickable 3D nodes; dependency edges use complete/available/locked state without obscuring the source route.
  - Pointer drag, wheel/pinch zoom, labeled controls, reset, HTML route navigation, and reduced-motion behavior remain available.
  - Desktop and 390px mobile preserve the original mountains, water, forest, architecture, character, labels, and luminous route with no horizontal overflow.
  - Local and production browser checks show no application console errors.
- Verification: `npm run check`; focused taxonomy edge test; `npm audit --audit-level=high`; browser desktop/mobile screenshots; live drag/wheel/reset transform or canvas pixel change; landmark selection; production URL read-back.
- Harness: existing Vite/React/Three stack, exact supplied textures, taxonomy fixtures, in-app Browser, Vercel-linked project.
- State surface: WebGL atlas group rotation/scale, responsive texture and dimensions, taxonomy region edges, node status, existing progress state.
- Execution surface: current feature branch and PR #1; explicit production Vercel deployment after verification; no merge.
- Feedback signals: tests/build, canvas screenshots, dynamic input checks, console logs, Vercel deployment status, production smoke check.
- Convergence condition: true WebGL terrain and region graph are visible and interactive with no actionable P0/P1/P2 or motion-blocking finding.
- Human boundary: production deployment is authorized by the user in this turn; PR merge, auth changes, credentials, and data model changes are not authorized.
- Risk: WebGL texture color/fit can regress; lines can clutter source labels; excessive geometry can hurt mobile rendering.
- Security scan receipt: required because public product code is changing.
- Skillification route: N/A; bounded product feature.
- Work type: feature.
- Loop receipt: N/A; deterministic implementation and verification.
- Dynamic harness mode: off; one architecture and deterministic verifier are sufficient.
- Context risk / handoff trigger: monitor; one repo and one tightly coupled visual surface.
- Product decision frame: use a shallow curved WebGL atlas plus raised DAG nodes, not a force-directed floating graph or a full photogrammetric globe. This preserves the storybook composition and makes prerequisites spatially real.
- Project rails receipt: repo instructions, README, `npm run check`, taxonomy validator, tests, QA receipts, GitHub remote, PR, and linked Vercel project are present.
- Complexity gate: reuse R3F, Drei, Three textures, existing pointer state, and existing taxonomy JSON; add no dependency, shader framework, force-graph engine, physics engine, or 3D asset pipeline.
- Out of scope: generated depth map, animated character, free 360-degree globe, new curriculum, backend, Privy changes, English expansion.
- Do not touch: auth/provider configuration, progress persistence, mission content, Vercel environment variables.
- Suggested labels: `webgl`, `skill-graph`, `visual-fidelity`, `3d`
- Owner: JhiNResH
- Follow-up worker: N/A; subagents were not authorized.

## Harness metadata

- Model / provider: Codex / OpenAI
- Harness version: founder-engineering-workflow 0.2.8
- Context loaded: PR #1 illustrated atlas implementation, exact desktop/mobile textures, curriculum topics/dependencies/missions/regions, current app controls and QA receipts.
- Environment: React 19, Vite 8, React Three Fiber 9, Drei 10, Three 0.185, linked Vercel project.
- Verifier shape: behavioral invariants for region-edge derivation plus browser-rendered visual and input evidence.
- Reference policy: exact illustration and readable authored composition are required; shallow surface curvature, node depth, and edge routing may vary within the fidelity constraints.
- Component signal: implementation, browser/WebGL rendering, interaction, verifier, or deployment.

## Motion receipt

- Interaction / trigger: direct drag, wheel/pinch zoom, direction/zoom/reset controls.
- Frequency: frequent during exploration.
- Purpose: spatial inspection and graph comprehension.
- Input matrix: pointer, touch/pinch, wheel/trackpad, keyboard-accessible buttons.
- Reduced-motion expectation: smaller bounded rotation response and no idle/looping motion.
- Normal-speed evidence: browser drag and wheel checks.
- Slow-motion/frame evidence: N/A; interaction is direct 1:1 with no timed transition.
- Performance signal: on-demand canvas, capped DPR, no rAF loop, bounded geometry and transform-only interaction state.
- Motion checker: `review-animations` explicit verdict before ship.
