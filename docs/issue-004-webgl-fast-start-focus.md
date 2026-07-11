# Issue 004 — WebGL 快速啟動與技能聚焦

## PM Gate

- **Repo:** `JhiNResH/growth-planet-learning`
- **Problem:** 首次進入同時下載 JPG fallback 與 WebP texture，且 3D chunk 引入 Drei 輔助元件；選擇技能後雖有亮點，但空間焦點與關係路徑不夠清楚。
- **Goal:** 保留插畫細節與直接拖曳手感，降低冷啟動下載／執行成本，並讓點選技能後可快速看懂所在位置與相依關係。
- **Work type:** 使用者可見功能 + 一次性效能修正。
- **Acceptance criteria:**
  1. Loading fallback 與 WebGL 共用同一組 responsive WebP，不再額外下載 atlas JPG。
  2. 3D scene 不再依賴 Drei 的 `Line`、`Stars`、`useTexture`；不以 preload 猜測裝置，避免高 DPR 手機重複下載。
  3. 點選數學技能時，atlas 在 300ms 內溫和聚焦該節點；與該節點相連的 hard dependency 清楚高亮。
  4. 拖曳、雙指縮放、滾輪與既有控制按鈕維持可用；reduced motion 不做位置補間。
  5. 星點與路徑不做無限動畫，device pixel ratio 維持既有上限；停止重繪留待具備 WebGL lifecycle 測試後再做。
- **Verification:** `npm run check`、`npm audit --audit-level=high`、bundle before/after、桌面與手機瀏覽器互動檢查、motion checker、`git diff --check`。
- **Harness:** 本地 Vite preview；React state／WebGL 畫面為 state surface，build/test/browser 為 feedback signals。
- **Convergence condition:** 驗收條件全過、無 console error、無 critical motion/accessibility finding，且 diff 僅含本 issue。
- **Human boundary:** PR #1 merge 已授權；本階段可建立 branch/commit/PR，但不部署、不合併新 PR。
- **Risk:** texture preload media query 可能選錯資產；焦點補間可能與拖曳打架。Demand rendering 實測會漏畫首幀，本階段明確不採用。
- **Security scan receipt:** 產品程式碼需執行 npm high-severity audit；不新增 auth、資料或外部輸入面。
- **Dynamic harness mode:** off；本地 serial work 足夠。
- **Context risk:** monitor。
- **Project rails:** `npm run check` 已包含 taxonomy validation、tests、TypeScript build；PR 為 handoff receipt。
- **Complexity gate:** 使用 Three/R3F 已安裝原生 primitive；不加動畫套件、不加 camera controller、不新增通用 graph abstraction；不為停幀加入 timer 或 lifecycle glue。
- **Out of scope:** 新課程內容、登入流程改版、後端進度同步、部署。
- **Do not touch:** Privy 設定、curriculum schema、Vercel production。

## Product decision frame

- **Decision:** 以短距離 atlas 位移 + 小幅 scale 表達聚焦，而不是鏡頭飛行。
- **Options considered:** camera fly-to、完整 orbit controller、atlas group focus。
- **Chosen tradeoff:** atlas group focus 可保留既有直接拖曳與插畫構圖，且不增加依賴。
- **Rejected alternative:** camera fly-to 容易造成暈動並與手勢狀態競爭；完整 controller 超出本階段。
- **Expected outcome:** 孩子點選地標後能立即知道「我在哪裡」及「和哪些技能相連」。
- **Verification:** 點選不同節點、連續快速切換、reduced-motion、拖曳後再選擇。

## Verification receipt

- `npm run check`: pass — taxonomy 18 topics / 18 dependencies / 9 clusters / 9 missions，2 test files、7 tests，TypeScript + Vite build 完成。
- `npm audit --audit-level=high`: pass — 0 vulnerabilities。
- `git diff --check`: pass。
- Bundle: `PlanetScene` 909.96 kB / gzip 243.19 kB → 888.72 kB / gzip 236.92 kB；移除 Drei 後 package lock 淨減 437 行 dependency metadata。
- Cold-load asset: fallback 從 379.6 kB JPG 改為和 WebGL 共用的 responsive WebP；不加入可能猜錯 DPR 的 preload。
- Browser desktop: 數學地標 2 → 3 → 4 快速切換後，`比較峽谷` 保持 `aria-current="step"`，panel heading 唯一，console 0 errors。
- Browser gestures: 3D stage 完成 pointer drag 與 wheel zoom，console 0 errors。
- Accessibility: 沒有新增不可達的 Canvas-only control；既有 HTML 地標 navigation、標示控制與 aria-live 保持為等價操作面。
- Motion checker: `motion-review.md` verdict **Approve**；聚焦約 245ms，快速重定向不鎖 input，reduced-motion 直接套用最終 transform。
- Complexity checker: 移除 Drei 與手寫 seeded random；剩餘程式均直接服務 texture、static stars、native paths 或 focus。`net: -350 lines`（含 lockfile）。
- Deferred: demand rendering 在動態檢查會漏畫首幀，已撤回；需獨立 WebGL lifecycle harness 後再做。
