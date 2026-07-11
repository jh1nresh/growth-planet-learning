# Issue: Restore the illustrated Growth Planet detail

## PM Gate

- Title: Replace low-poly world art with an illustrated interactive atlas
- Repo: `JhiNResH/growth-planet-learning`
- Problem: The current WebGL globe proves rotation and zoom, but its flat teal sphere, geometric land blobs, and tiny generic markers discard the supplied reference's painterly terrain, buildings, luminous trail, character, depth, and narrative atmosphere.
- Goal: Keep direct 3D interaction while making the supplied illustrated planet—not procedural geometry—the dominant visual truth.
- Acceptance criteria:
  - The first viewport visibly contains painterly mountains, forest, water, architecture, atmospheric light, and a connected glowing learning path.
  - A high-resolution raster asset derived from the exact supplied reference supplies the terrain detail; CSS shapes and low-poly land masses no longer impersonate the artwork.
  - The world still supports drag, wheel/pinch zoom, direction controls, reset, landmark selection, keyboard-equivalent HTML navigation, and reduced motion.
  - Available, complete, locked, and coming-soon landmarks remain distinguishable without covering the illustration.
  - Desktop and 390px mobile retain an unobstructed primary mission CTA and no horizontal overflow.
  - Source and implementation are placed in the same comparison image; no actionable P0/P1/P2 fidelity finding remains.
- Verification: `npm run check`; dependency audit; local browser desktop/mobile screenshots; drag/zoom hash change; landmark and mission flow; console errors; source/implementation composite; design QA; motion review.
- Harness: existing Vite/React/Three test rails plus the in-app Browser, exact supplied JPG, image generation for a UI-free atlas asset, and deterministic visual/interaction receipts.
- State surface: responsive illustrated atlas assets, one shared CSS 3D view transform, WebGL hotspot positions, existing curriculum/progress state.
- Execution surface: local branch and preview only; GitHub PR after verification.
- Feedback signals: reference comparison, viewport measurements, WebGL screenshot, input checks, build/tests/audit, structured review.
- Convergence condition: illustrated detail is visually dominant and interaction remains verified with no P0/P1/P2 design finding.
- Human boundary: no production deployment, merge, Privy setting, or credential change without fresh approval.
- Risk: a large texture can hurt mobile load/GPU memory; generated art can invent labels or distort the original style; overlay controls can obscure focal landmarks.
- Security scan receipt: required because public product code and dependencies change; no auth/data boundary is expanded.
- Skillification route: N/A; one-off visual correction.
- Work type: user-facing feature correction.
- Loop receipt: N/A; deterministic visual iteration only.
- Dynamic harness mode: off; one selected visual truth and one local implementation.
- Context risk / handoff trigger: monitor; same product and bounded visual surface.
- Product decision frame: illustrated 2.5D atlas over a fully procedural 360° globe. It preserves the requested manipulation while matching the product's authored storybook quality. A generic low-poly globe and a static flat screenshot are both rejected.
- Project rails receipt: existing AGENTS, README, check script, taxonomy validator, tests, design QA, motion review, and verification receipt are reused.
- Complexity gate: use the installed Three/R3F stack and one raster texture; delete the land-mass/landmark geometry rather than add a game engine, shader framework, animation library, or 3D model pipeline.
- Out of scope: new curriculum, auth, backend, audio, character animation, full 360° planet texture, production deploy.
- Do not touch: taxonomy content, progress model, Privy integration, Vercel project settings.
- Suggested labels: `visual-fidelity`, `3d`, `ui`, `illustration`
- Owner: JhiNResH
- Follow-up worker: N/A; subagents were not authorized.

## Harness metadata

- Model / provider: Codex / OpenAI
- Harness version: founder-engineering-workflow 0.2.8; Product Design image-to-code 0.1.50
- Context loaded: exact user-supplied 834×1194 reference, current production implementation, repo UI/Three source, prior QA receipts.
- Environment: macOS, Vite/React/Three, authenticated private GitHub remote.
- Verifier shape: behavioral invariants plus same-input visual comparison; not a single pixel diff because the reference is portrait app art and the implementation must remain responsive.
- Reference policy: one required art direction and focal hierarchy; responsive framing and hotspot placement may vary while painterly detail and narrative depth may not.
- Component signal: asset generation, WebGL composition, responsive layout, interaction, performance, or verifier/tooling.
