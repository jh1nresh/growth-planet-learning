# Design QA — True 3D Globe v1

- Source visual truth: `/Users/jhinresh/projects/growth-planet-learning/design/reference-growth-planet-original.jpg`
- Active renderer: `/Users/jhinresh/projects/growth-planet-learning/src/features/world/PlanetScene.tsx`
- Local route: `http://127.0.0.1:5174/`
- Tested states: Math front/360° rotation/drag/zoom, all Math missions, English starter, guest fallback.

## Result

The renderer is no longer a curved plane. It uses a true `SphereGeometry`; world regions are placed from latitude/longitude, dependency paths follow great-circle points, and depth-tested nodes/paths can move behind the globe. The authored illustration is projected only onto the front hemisphere and blends into a procedural ocean/land backside, avoiding a false rectangular UV wrap.

## Design decisions

| Before | After | Why |
| --- | --- | --- |
| 48×48 curved plane | 96×64 sphere with atmosphere shell | Provides a real silhouette, side, and back |
| Desktop/mobile 2D hotspot coordinates | `world.json` latitude/longitude | One spatial source of truth across viewport sizes |
| Quadratic paths above a plane | Great-circle tubes at a fixed globe radius | Paths remain attached while orbiting |
| ±0.24 rad horizontal clamp | Unbounded yaw | A globe must complete a full orbit |
| Atlas UV displayed as a rectangle | Object-normal front projection blended into procedural backside | Retains the detailed authored face without wrapping stars and labels around the back |

## Evidence

- Geometry unit tests cover front, east, back hemisphere, and constant-radius great-circle paths.
- State instrumentation verified more than 360° rotation, direct drag on both axes, wheel zoom, reset, and latitude/longitude focus.
- Eight Math missions and the English starter mission completed through visible UI with zero final console errors.
- Canvas is 575.6×590 CSS pixels with an 863×884 capped-DPR backing buffer in the desktop harness.
- Motion review verdict: **Approve**.

## Residual visual risk

The in-app Browser screenshot surface did not capture the WebGL framebuffer; it returned the DOM chrome with an empty Canvas in both demand and temporary always-render modes. Therefore front/side/back pixel fidelity and exact node occlusion are not claimed from screenshots. The PR preview requires a human visual check before merge. A production-quality 2:1 equirectangular painting remains the upgrade path for fully authored backside detail.

final result: conditional pass — implementation and interaction evidence pass; WebGL pixel review remains human-gated.
