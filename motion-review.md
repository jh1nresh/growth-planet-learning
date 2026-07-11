# Motion review — True 3D Globe

| Before | After | Why |
| --- | --- | --- |
| Curved plane clamped to ±0.24 rad horizontal tilt | `SphereGeometry` yaw is unbounded; controls verified `+6.545 rad` in one pass | A globe must support a complete orbit, not simulate depth with a small tilt |
| Selected skill used a continuous `useFrame` damping loop | Selection maps latitude/longitude to the front immediately | Route selection is frequent and keyboard-accessible; no animation is faster, interruptible by definition, and reduced-motion safe |
| Canvas rendered continuously while idle | `frameloop="demand"` plus one cancellable texture-ready frame | Removes idle GPU work without an unbounded custom rAF loop |
| Plane drag divided movement by 850/1100 and hit hard bounds | Pointer capture tracks yaw/pitch directly after 8px hysteresis; yaw remains unbounded and pitch alone is clamped | Keeps content attached to the pointer while preventing pole flips |

## Verdict

- **Purpose and frequency:** movement exists only for direct globe inspection, zoom, and immediate spatial wayfinding. There is no idle rotation, entrance animation, decorative oscillation, or animated keyboard action.
- **Performance:** React state updates only transforms; no DOM layout read/write loop, blur, filter, scroll polling, or independent animation timer exists. R3F renders on demand at DPR 1–1.5.
- **Interruptibility & timing:** drag and pinch are 1:1 and can reverse every pointer frame. Button and HTML route actions are immediate. No keyframe or fixed-duration transition can block input.
- **Accessibility:** the Canvas stays `aria-hidden`; labeled HTML controls and the full landmark list remain the keyboard path. With no automatic positional animation, reduced-motion users receive the same immediate state change while direct manipulation remains under their control.
- **Dynamic evidence:** 25 right-control presses changed yaw by `6.545 rad`; drag changed yaw `0.140 → 1.148` and pitch `-0.489 → -0.237`; wheel changed zoom `1.000 → 1.141`; reset returned yaw/pitch/zoom to zero/zero/one; console errors remained zero.
- **Capture-safe fallback:** `?renderer=compat` maps the same view state directly to CSS `rotateX` / `rotateY` / `scale` with no transition or idle loop; front-to-back rotation was visibly verified at yaw `2.391 rad`.
- **Review escalations:** no `transition: all`, `scale(0)`, `ease-in`, layout-property animation, ungated hover motion, or uninterruptible keyframe is present in the changed surface.

**Approve** — no feel-breaking regression, removable automatic motion, unbounded loop, missing reduced-motion behavior, or input-blocking timing remains.
