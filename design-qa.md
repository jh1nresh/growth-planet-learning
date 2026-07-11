# Design QA — WebGL Skill Graph

- Source visual truth: `/Users/jhinresh/projects/growth-planet-learning/design/reference-growth-planet-original.jpg`
- Mobile implementation: `/Users/jhinresh/projects/growth-planet-learning/artifacts/webgl-skill-graph-mobile.png`
- Same-input comparison: `/Users/jhinresh/projects/growth-planet-learning/artifacts/webgl-skill-graph-comparison.png`
- Rendered URL: `http://127.0.0.1:4173/`
- Tested state: Mathematics selected, guest progress 1/8, 390×817 CSS-pixel mobile viewport.

## Final result

No actionable P0/P1/P2 visual finding remains. The exact illustration now renders as a texture on a shallow curved WebGL mesh. Raised 3D nodes and taxonomy prerequisite curves add spatial structure while preserving mountains, water, forests, architecture, character, source labels, and the luminous authored route.

## Required fidelity surfaces

- Typography and copy: the source Traditional Chinese labels remain inside the texture; existing Songti/PingFang product chrome and curriculum copy are unchanged.
- Layout: the measured mobile stage is 380.5×556 pixels inside a 390×817 viewport; document scroll width is 380 pixels with no horizontal overflow.
- Color and image quality: WebP texture copies retain the source crop and color density. WebP is required for reliable GPU upload in the in-app browser; the JPEGs remain as loading/fallback assets.
- Graph hierarchy: complete/available/locked states use small raised nodes. Hard and soft prerequisite curves differ in weight and stay subordinate to the source artwork.
- Accessibility: the WebGL layer remains decorative to assistive technology; all regions have equivalent native HTML route buttons, focus treatment, status announcements, and labeled view controls.

## Same-input comparison findings

| Before | After | Why |
| --- | --- | --- |
| DOM illustration with WebGL rings floating above it | Exact illustration on a 48×48 curved WebGL mesh | Surface, nodes, and connections now share real perspective |
| Region order implied a single linear route | 11 deduplicated region-level prerequisite edges from taxonomy topic dependencies | Makes the Marble-inspired DAG visible without changing curriculum data |
| Three incorrect hotspot IDs omitted Shape, Measure, and Supply nodes | Coordinates use the actual region IDs | All eight Math landmarks now render |
| Immediate pointer capture prevented node clicks | 8px drag hysteresis before pointer capture | A tap selects a node while a drag remains direct and interruptible |
| React wheel handling could allow page scroll over the canvas | Non-passive native wheel listener isolates zoom | Trackpad/wheel zoom changes the world without moving the document |
| JPEG texture decoded as an untextured surface in the WebGL harness | Equivalent high-quality WebP textures | Stable GPU texture upload with comparable size and fidelity |

## Evidence

- Taxonomy projection test passes with 11 expected Math region edges.
- 3D node click changed the selected HTML route from Counting Harbor to Bundle Bridge.
- Pointer drag changed the rendered frame hash.
- Wheel zoom changed the rendered frame while document scroll remained unchanged.
- Mobile and desktop browser reads reported zero application console errors.
- `npm run check` and dependency audit receipts are recorded in the PR/deploy handoff.

final result: passed
