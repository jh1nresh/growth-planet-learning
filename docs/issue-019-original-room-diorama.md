# Issue 019 — 讓 Room Lab 成為 Oshiami 原創微縮生態房間

## Problem

第 8 課已經有可計算的 `under / on / next to` 互動與 mastery evidence，但視覺仍像平面的教學示意圖，沒有參考 [Marble Ecosystem Simulator](https://withmarble.com/ecosystem-simulator) 那種「一眼看見活世界」的場景密度與景深。

## Product decision

- 借用大型活場景、前中後景、漂浮狀態工具與即時因果回饋的設計原則。
- 所有圖像改由 Oshiami 原創：兒童房微縮世界、窗景、植物、書本、積木與紙雕質感。
- 不下載、嵌入或重製 Marble 的 Logo、島嶼輪廓、動物 sprites、介面截圖、CSS、字型或控制列。
- 保留現有純函式 lesson state、原生按鈕、mastery evidence 與不錄音邊界。

## Acceptance criteria

- Room Lab 使用一張 repo-local、無 script、無外部 URL 的原創 SVG 場景。
- 椅子、書包、位置標籤與控制仍由 HTML/React 管理；裝飾資產不攔截 pointer 或輔助科技。
- 場景具有遠景、主要教學物件與前景，但書包和椅子保持最高視覺優先級。
- 書包只用可中斷的 `transform` transition，時間低於 300ms；reduced motion 時移除位移動畫。
- 半透明工具面板在 reduced transparency 時變成不透明。
- 390 × 844、768 × 1024、1440 × 900 無水平溢出，三個位置按鈕至少 44px。
- 既有 Room Lab 狀態、hint/retry、單次 evidence 與完整 repo check 不回歸。

## Harness

- **State surface:** 現有 `EnglishRoomLessonState`，不修改。
- **Execution surface:** 一張 SVG asset、Room Lab markup 的裝飾層、scoped CSS。
- **Feedback:** Room Lab tests、`npm run check`、audit、三尺寸 Chrome smoke、motion/reduced-motion 檢查。
- **Convergence:** 視覺明顯由「示意圖」變成「可操作微縮世界」，且所有 deterministic evidence 保持一致。
- **Human boundary:** 可建立 commit、private GitHub repo 與 push；不 merge、不 deploy、不公開發佈。

## Complexity and security

- 使用 Vite 既有 SVG bundling 與 CSS；不新增依賴、Canvas、WebGL、粒子或持續動畫。
- SVG 只含靜態 path/shape/gradient，目標小於 150 KB。
- Security receipt：source inspection、SVG external-reference scan、`npm audit --audit-level=high`。
- 不觸及 Privy、家庭帳號、Supabase、進度 namespace、taxonomy snapshot、數學或語文課。
