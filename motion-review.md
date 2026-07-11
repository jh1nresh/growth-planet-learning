# Motion review — WebGL Skill Graph

| Before | After | Why |
| --- | --- | --- |
| CSS transformed a DOM picture while WebGL markers remained a separate layer | One R3F group rotates/scales the curved texture, nodes, and edges together | Maintains spatial consistency under every input |
| Pointer capture began on press | Capture begins after 8px hysteresis, or immediately for pinch | Preserves tap selection and makes drag intent explicit |
| Wheel handling depended on React event delivery over Canvas | Passive-disabled native wheel listener with cleanup | Prevents page scroll and keeps zoom continuous over WebGL |
| Full motion multiplier `1.7` | Reduced-motion multiplier `0.9` | Keeps orientation feedback while reducing large-surface tilt |
| Selected node changed only its glow | Atlas shifts 18% toward the selected point and scales to `1.045` with critically damped interpolation | Makes graph location legible without a camera flight or loss of user control |
| All dependency paths retained similar prominence | Unrelated paths dim to `0.09`; selected hard dependencies rise to `0.84` | Uses state contrast to explain the selected skill relationship |

## Verdict

- Purpose and frequency: motion exists only for direct world inspection and spatial continuity when a skill is selected; there is no decorative entrance or idle oscillation.
- Interruptibility and timing: pointer movement maps directly to bounded group rotation; selection focus retargets from its live Three.js group transform and reaches roughly 98% in 245ms (`lambda 16`), with no keyframe or input lock.
- Input matrix: pointer drag, touch/pinch, wheel/trackpad, native buttons, and reset share one view state. HTML route navigation remains the keyboard path.
- Performance: scene geometry is bounded to one 48×48 plane, 8 nodes, 11 native Three.js tubes, 360 static points, and capped DPR 1–1.5. One component-level `useFrame` performs only transform interpolation; no layout/paint read, independent rAF, blur, or filter animation was added.
- Accessibility: reduced motion lowers rotation response and applies focus position/scale immediately without interpolation; visible focus and labeled equivalent controls remain.
- Review escalations: no `transition: all`, `scale(0)`, `ease-in`, layout-property animation, ungated hover motion, or uninterruptible keyframe exists in the changed surface.

**Approve** — no feel-breaking regression, obvious removable motion, easy GPU fix, missing reduced-motion path, or interaction-blocking timing remains.
