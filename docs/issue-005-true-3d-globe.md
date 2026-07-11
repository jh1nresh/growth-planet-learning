# Issue 005 — 真正可環繞的 3D 成長星球

## PM Gate

- **Repo:** `JhiNResH/growth-planet-learning`
- **Problem:** 現有世界是微彎曲 `PlaneGeometry`，只能小幅傾斜；沒有球體背面、360° 旋轉、經緯度節點或球面遮擋，因此仍像平面圖片。
- **Goal:** 將主世界改成真正球體，讓孩子可 360° 拖曳、縮放與點選球面技能，同時保留目前插畫正面的細節感。
- **Work type:** user-facing feature。
- **Acceptance criteria:**
  1. 使用 `SphereGeometry`，可水平無限環繞，能看見程序化背面。
  2. 技能節點使用 `world.json` 的 latitude / longitude，背面節點由球體自然遮擋。
  3. dependency edge 沿球面大圓弧排列，不再是平面曲線。
  4. pointer drag、touch drag、pinch、wheel 與 HTML 控制按鈕可用；拖曳保持 1:1 且不鎖 input。
  5. 選擇 HTML 學習地標會立即把對應經緯度帶到正面；不使用自動補間，direct manipulation 在 reduced motion 下仍保持 1:1。
  6. Canvas 使用 on-demand rendering、DPR 上限 1.5，沒有 idle animation loop。
- **Verification:** geometry unit tests、`npm run check`、`npm audit --audit-level=high`、desktop/mobile browser、360° 前後畫面、drag/wheel/buttons、rapid selection、reduced motion、console errors、motion checker、Ponytail review、`git diff --check`。
- **Harness:** local Vite preview；React `GlobeView` 為 state surface，R3F Canvas 為 execution surface，tests/build/browser/logs 為 feedback signals。
- **Convergence condition:** 球體前後可辨、旋轉超過 360°、節點／路徑跟著球體、全部檢查通過且沒有 critical motion/accessibility finding。
- **Human boundary:** 可 branch、commit、push、開 PR；不 merge、不 deploy。
- **Risk:** 正面插畫不是 360° 貼圖；shader 投影邊緣可能露出背景；on-demand texture 首幀可能漏畫；球面 hit target 在背面必須正確 occlude。
- **Security scan receipt:** npm high-severity audit；不增加 auth、資料、網路輸入或 dependency。
- **Skillification route:** one-off feature；不建立新 skill/loop。
- **Dynamic harness:** off；單一 WebGL surface 與可執行 verifier 足夠。
- **Context risk:** monitor；範圍限制在 world renderer、geometry test 與 receipts。
- **Project rails:** repo `AGENTS.md`、`npm run check`、taxonomy validator、Vitest、PR receipt 已存在。
- **Out of scope:** 完整手繪 360° equirectangular atlas、GLB 城堡模型、自動 idle rotation、課程內容或登入修改。
- **Do not touch:** curriculum schema/content、Privy、progress storage、Vercel production。

## Product decision frame

- **Decision:** 真球體 + 正面插畫投影 shader + 程序化背面。
- **Options considered:** 直接把 rectangular atlas 包球、純程序化低模星球、等待完整 360° 美術貼圖。
- **Chosen tradeoff:** 正面保留現有插畫辨識度，旋轉後仍有真實球面與可探索背面；不新增資產或套件。
- **Rejected alternative:** 直接 UV wrap 會扭曲星空與文字；純程序化會再次失去細緻感；等待美術會阻塞真 3D 的產品驗證。
- **Expected outcome:** 使用者能明確感覺自己在轉一顆星球，而不是移動一張圖。
- **Verification:** 正面、側面、背面三個角度；節點遮擋；完整水平旋轉；選點回正。

## Complexity gate

- **Need exists:** `PlaneGeometry` 無法滿足 360° 球體。
- **Native/existing option:** Three.js `SphereGeometry`、`ShaderMaterial`、`Vector3`、Pointer Events；不新增依賴。
- **Smallest correct path:** 一個純 geometry helper + 現有 `PlanetScene` renderer replacement。
- **Deliberately skipped:** OrbitControls、physics/spring library、GLTF pipeline、通用 graph engine。
- **Upgrade trigger:** 取得正式 2:1 equirectangular art 時，以 standard material 取代正面投影 shader。
- **Safety not simplified:** HTML 等價控制、reduced motion、DPR cap、on-demand rendering、pointer capture 均保留。

## Verification receipt

- Geometry: `SphereGeometry` surface；latitude/longitude front/east/back mapping 與 great-circle radius 有 4 個 unit tests。
- Rotation: 25 次向右控制使 yaw 增加 `6.545 rad`，大於完整 360°；沒有水平 clamp。
- Selection: 快速選擇比較峽谷再選運算森林，最終為 `yaw 0.140`、`pitch -0.489`、`aria-current="step"`，符合 longitude `-8°` / latitude `-28°`。
- Direct manipulation: pointer drag 使 yaw `0.140 → 1.148`、pitch `-0.489 → -0.237`；wheel 使 zoom `1.000 → 1.141`；reset 回到 `0 / 0 / 1`。
- Curriculum: 依 UI 完成 8 個數學任務共 17 題，進度到 8/8；完成 2 題英文 starter；guest fallback 保持可用。
- Latent fix: 完成 3 題任務後切到 2 題任務原會暫時沿用 out-of-range index，`MissionDialog` 現在 fallback 到第一題；重跑英文流程無 crash。
- Accessibility: Canvas 保持 `aria-hidden`，7 個 view controls 與完整地標 navigation 都是 native buttons；browser keyboard injection 未能觸發 Enter/Space，但 native button semantics 與 focus surface 未改。
- Mobile: Browser viewport override 實際回報 796 CSS px，未能建立真 390 px viewport；該寬度下 `scrollWidth === clientWidth`、controls 存在、console 0 errors。真窄螢幕 visual 留作 PR preview human check。
- Visual limitation: Browser screenshots 不包含 WebGL framebuffer，即使 always-render ablation 亦相同；Canvas/backing buffer 尺寸正常，shader console 0 errors。前／側／背像素證據因此標記為未驗證，不以 DOM screenshot 冒充。
- Rendering rail: final code 使用 `frameloop="demand"`、DPR 1–1.5、texture-ready 單次且可取消的 rAF invalidate，沒有 idle loop。
- Automated gate: `npm run check` 通過（taxonomy 18 topics / 18 dependencies / 9 clusters / 9 missions，3 test files / 12 tests，production build）；`npm audit --audit-level=high` 回報 0 vulnerabilities；`git diff --check` 通過。
- Build note: Vite 仍回報既有的大型 chunk warning；3D renderer chunk 為 889.64 kB / gzip 237.09 kB，未新增 dependency，後續若要處理應獨立做全站 code-splitting，而非混入本功能 PR。
- Capture compatibility: Codex in-app Browser 與 Chrome automation 都能載入 Canvas 並更新 yaw，但畫面擷取層會把 WebGL framebuffer 顯示為空白／破圖。`?renderer=compat` 現提供同步 yaw / pitch / zoom 的雙面 CSS 3D 星球；正常網址仍使用真正 WebGL renderer。
- Compatibility verification: 相容預覽正面插畫可見，7 次向右控制將 yaw `0.845 → 2.391` 並顯示程序化背面；新增 transform unit test，完整 gate 為 3 test files / 12 tests。
