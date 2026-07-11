# Motion review — WebGL Skill Graph

| Before | After | Why |
| --- | --- | --- |
| CSS transformed a DOM picture while WebGL markers remained a separate layer | One R3F group rotates/scales the curved texture, nodes, and edges together | Maintains spatial consistency under every input |
| Pointer capture began on press | Capture begins after 8px hysteresis, or immediately for pinch | Preserves tap selection and makes drag intent explicit |
| Wheel handling depended on React event delivery over Canvas | Passive-disabled native wheel listener with cleanup | Prevents page scroll and keeps zoom continuous over WebGL |
| Full motion multiplier `1.7` | Reduced-motion multiplier `0.9` | Keeps orientation feedback while reducing large-surface tilt |

## Verdict

- Purpose and frequency: motion exists only for direct world inspection and state selection; there is no decorative entrance or idle oscillation.
- Interruptibility: pointer movement maps directly to bounded group rotation; no keyframe or timed transition blocks input.
- Input matrix: pointer drag, touch/pinch, wheel/trackpad, native buttons, and reset share one view state. HTML route navigation remains the keyboard path.
- Performance: scene geometry is bounded to one 48×48 plane, 8 nodes, 11 curves, capped DPR 1–1.5, and no component-level `useFrame` work. The engine-owned render loop stops with Canvas lifecycle and browser visibility; no independent runaway rAF loop was added.
- Accessibility: reduced motion halves the rotation response; visible focus and labeled equivalent controls remain.
- Review escalations: no `transition: all`, `scale(0)`, `ease-in`, layout-property animation, ungated hover motion, or uninterruptible keyframe exists in the changed surface.

**Approve** — no feel-breaking regression, obvious removable motion, easy GPU fix, missing reduced-motion path, or interaction-blocking timing remains.
