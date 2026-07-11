# Issue 007 — 數學與英文技能星圖

## PM Gate

- **Repo / branch:** `JhiNResH/growth-planet-learning` / `feat/true-3d-globe`（更新既有 PR #3）。
- **Problem:** WebGL 在 Codex 預覽不可見，且球體表現層掩蓋了真正的學習結構；使用者無法直接理解科目、micro-topic 與 prerequisite。
- **Goal:** 以 Marble Skill Taxonomy 的 graph interaction 為架構，建立可見、可點、可用鍵盤操作的數學／英文雙星系。
- **Acceptance criteria:** 根頁面無 Canvas；同時可選 Math／English subject anchors；Math 顯示 15 topics、English 顯示 3 topics；hard/soft prerequisites 可辨；點 topic 更新對應 region、topic 描述與 evidence；任務流程、guest progress、Privy fallback 不退化；實驗星球保留於 `?view=planet`。
- **Verification:** layout unit tests、taxonomy DAG validator、production build、browser Math/English switch、topic click、right panel、keyboard semantics、mobile overflow、console、`npm audit --audit-level=high`、Ponytail review。
- **Harness:** curriculum JSON 為 state surface；React + SVG/HTML graph 為 execution surface；Vitest/build/browser/PR 為 feedback signals。
- **Convergence condition:** 根頁可見且無 WebGL 依賴；subject 與 topic 選取有一致狀態；所有 graph/topic assertions 與 repo gate 通過。
- **Human boundary:** 可修改、commit、push、更新 PR；不 merge、不 deploy。
- **Risk:** DAG 自動 layout 可能擁擠；同 cluster 多 topic 必須保留 topic-level selection；Math/English 之外科目不得誤入 MVP。
- **Security scan receipt:** `npm audit --audit-level=high`；不新增 dependency、auth、network 或 child data surface。
- **Work type:** user-facing feature；one-off implementation，不建立 loop。
- **Dynamic harness:** off；單一資料圖與 deterministic layout 足夠。
- **Context risk:** monitor；沿用同一 repo/PR，3D renderer 僅降級為實驗 route。
- **Out of scope:** 匯入 Marble 1,590 topics、Science/Life Skills、自由拖動畫布、graph physics、3D graph、backend sync。
- **Do not touch:** Taiwan curriculum wording、Privy、progress storage、production deployment。

## Product decision frame

- **Decision:** 學習 graph 是主產品 surface；星球是未來可替換的 presentation layer。
- **Options considered:** 繼續修 WebGL、使用 3D force graph、SVG/DOM deterministic DAG。
- **Chosen tradeoff:** SVG 畫 edges、HTML buttons 畫 nodes；在所有預覽可見、具原生鍵盤語意、可測試且零新依賴。
- **Rejected alternatives:** WebGL 已被實際環境阻擋；3D force graph 會增加 dependency、不可預測 layout 與 accessibility 成本。
- **Expected outcome:** 孩子先選科目，再沿先修線點亮能力星；家長可在右側理解這顆星代表什麼、怎樣算學會。
- **Reference policy:** 學習 Marble 的 node/subject/age/dependency/trace 架構；不複製其 IDs 或文字內容。

## Harness metadata and rails

- **Model/provider:** Codex / OpenAI。
- **Harness:** founder-engineering-workflow v0.2.8 + repo `AGENTS.md` + Vite/Vitest/browser。
- **Verifier shape:** graph invariants + deterministic layout bounds + visible browser state；不要求單一像素 gold image。
- **Component signal:** previous failure belonged to WebGL/browser composition and product representation, not curriculum data。
- **Repo readiness:** instructions/check/test/build/smoke/PR evidence all present。
- **Complexity gate:** existing React/SVG/HTML and current JSON cover the need；no graph library, router, state library, animation library, or copied dataset。

## Verification receipt

- Data/layout: Math 15 nodes / 16 edges；English 3 nodes / 2 edges；all prerequisite targets have greater DAG depth；all nodes remain inside deterministic view-box bounds and map to a region。
- Topic selection: English subject anchor changes the panel to `英文港口`；selecting `打招呼與自我介紹` leaves exactly 1 pressed topic node and displays its description plus 2 mastery evidence items。
- Visible root: root route contains 0 Canvas, 2 subject controls, native HTML topic buttons, SVG hard/soft edges, visible focus and no console errors；experimental WebGL remains isolated at `?view=planet`。
- Mobile: effective 320px browser width has `bodyScrollWidth === bodyClientWidth`；the constellation owns an intentional 760px horizontally scrollable exploration surface while the 2 subject tabs stay visible outside it。
- Progress: topbar follows the active constellation (`數學星系完成 13%` in final default state) rather than always reporting Math while English is active。
- Automated gate: taxonomy 18 topics / 18 dependencies / 9 clusters / 9 missions, 4 test files / 15 tests, TypeScript and production build pass；`git diff --check` pass。
- Security: `npm audit --audit-level=high` reports 0 vulnerabilities；no dependency or external data import added。
- Ponytail review: deterministic layout helper, one presentation component, and native SVG/HTML are the minimum correct path. No graph engine, force simulation, router, state library, or animation loop. Lean already. Ship.
