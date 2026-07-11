# Motion review — illustrated atlas

| Before | After | Why |
| --- | --- | --- |
| Orbit behavior depended on a separate WebGL camera state | Illustration and WebGL markers share one transform state | Keeps art and hotspots spatially aligned |
| Browser drag and wheel behavior were not deterministic | Pointer capture tracks drag 1:1; wheel and pinch update the same bounded zoom | Direct manipulation is immediate, interruptible, and verifiable |
| Large rotation range risked distorting painterly labels | Rotation is constrained to ±0.24 radians horizontally and ±0.15 vertically | Adds depth while preserving legibility and authored composition |
| Full motion used a 30× tilt multiplier | Reduced-motion preference uses an 18× multiplier | Retains useful spatial feedback with gentler movement |

## Verdict

- Directness: pointer movement updates the compositor transform continuously; there is no gesture-completion animation or input lockout.
- Interruptibility: every pointer move retargets from the active gesture state, and pointer capture keeps the world attached to the finger/cursor outside its bounds.
- Multi-input: primary mouse/touch drag, two-pointer pinch, wheel zoom, direction/zoom buttons, and reset use the same bounded view model.
- Performance: only `transform` changes during interaction. One continuously manipulated atlas viewport uses `will-change`; Canvas remains on-demand with DPR capped at 1–1.5.
- Accessibility: controls are labeled and keyboard accessible. Reduced motion lowers the tilt response; no decorative entrance or looping world animation was added.
- Cohesion: frequent controls respond immediately and use the existing 130ms active feedback, with no slow or ornamental transition on the world itself.

**Approve** — no feel-breaking motion regression, uninterruptible gesture, layout-property animation, or missing equivalent control remains.
