# Issue 006 — 真正立體的數學大陸 vertical slice

## PM Gate

- **Repo:** `JhiNResH/growth-planet-learning`
- **Problem:** 現有 WebGL renderer 雖使用球體，但主要視覺仍來自平面插畫投影；側轉時缺少地形、山脈、橋與塔的幾何厚度，因此產品感受仍是 2.5D。
- **Goal:** 在正常 WebGL renderer 建立會遮擋、受光且從球面凸起的數學大陸與地標；90° 側視必須能辨認幾何厚度。
- **Acceptance criteria:** 球面上有凸起 land masses；位值塔、十個一造橋、運算森林、補給站山群與其餘地標是實際 mesh；節點與路徑浮於地形之上；360° 控制、學習流程與相容模式不退化；無 idle render loop。
- **Verification:** `npm run check`、`npm audit --audit-level=high`、`git diff --check`、normal renderer DOM/console/interaction、側面幾何人工檢查、Ponytail review。
- **Harness:** React state 為 state surface；R3F scene graph 為 execution surface；Vitest/build/browser/PR preview 為 feedback signals。
- **Convergence condition:** 自動 gate 通過，scene graph 含實際地形與地標 primitives，互動狀態可旋轉超過 90°，且人工可在正常瀏覽器辨識凸起厚度。
- **Human boundary:** 可修改、驗證、commit、push、更新 PR；不 merge、不 deploy。
- **Risk:** primitive 數量增加造成 GPU 負擔；地形遮住節點／路徑；Codex 預覽無法擷取 WebGL，因此真 3D 像素仍需正常瀏覽器人工確認。
- **Security scan receipt:** `npm audit --audit-level=high`；不新增 dependency、資料輸入、auth 或 network surface。
- **Work type:** feature；one-off vertical slice，不建立 loop 或 skill。
- **Dynamic harness mode:** off；單一場景與既有 verifier 足夠。
- **Context risk:** monitor；同一 repo、同一 renderer、同一 PR。
- **Out of scope:** 完整 GLB 美術管線、物理、陰影貼圖、所有學科、正式 2:1 texture。
- **Do not touch:** curriculum content/schema、Privy、progress storage、production deployment。

## Product decision frame

- **Decision:** 先用既有 Three.js primitives 做童話模型 vertical slice，再以正式 GLB 替換。
- **Options considered:** 繼續用 shader displacement、直接導入外部 GLB、程序化 primitive terrain kit。
- **Chosen tradeoff:** primitives 不新增資產或依賴，能立即驗證厚度、遮擋、光影與效能；美術品質上限明確。
- **Rejected alternatives:** shader displacement 仍無可辨識建築；未經美術製作的外部 GLB 會引入來源與風格風險。
- **Expected outcome:** 使用者側轉星球時能看到山、塔、橋與森林真正突出球面。

## Complexity gate

- **Need exists:** 球面貼圖無法提供地標幾何厚度。
- **Existing dependency:** Three.js/R3F 已有 `icosahedronGeometry`、`coneGeometry`、`cylinderGeometry`、`boxGeometry` 與 standard material。
- **Chosen smallest correct path:** 一個 tangent surface group、terrain blobs、四種辨識度高的 landmark compositions，其餘地標使用同一最小 building composition。
- **Deliberately skipped:** 新套件、通用 scene DSL、GLTF loader、shadow-map pipeline、動畫 library。
- **Upgrade trigger:** vertical slice 人工通過後，再建立 Blender/GLB asset brief 與 LOD pipeline。
- **Safety not simplified:** HTML controls、depth occlusion、on-demand render、DPR cap 與相容預覽保留。

## Verification receipt

- Scene geometry: 8 個 latitude/longitude terrain meshes；位值塔使用 cylinder + cone；造橋使用 box + cylinders；森林與山群使用多個 cones；其餘地標使用 box + cone building composition。
- Elevation: terrain 外緣約 `radius + 0.155`；skill edges 位於 `radius + 0.17`；nodes 位於 `radius + 0.38`，避免路徑與節點埋入地形。
- Automated gate: taxonomy 18 topics / 18 dependencies / 9 clusters / 9 missions；3 test files / 12 tests；TypeScript 與 production build 通過；`git diff --check` 通過。
- Performance signal: `PlanetScene` production chunk `893.10 kB / gzip 237.98 kB`，相較上一版增加約 2.85 kB；仍維持 demand rendering 與 DPR 1–1.5。
- Security: `npm audit --audit-level=high` 回報 0 vulnerabilities；無新增 dependency。
- Browser: normal route 掛載 1 個 Canvas；app-side 無 error。Chrome extension 自身有 `Cannot redefine property: ethereum`，判定與 repo 無關。
- Interaction limitation: 本輪 browser click injection 未改變 yaw，因此不列為新證據；控制程式未改動，完整 360° dynamic evidence 沿用 Issue 005。正常瀏覽器人工側視仍是 merge 前 gate。
- Ponytail review: Lean already. Ship. 新增 primitives 與一個 tangent group，沒有 scene DSL、asset pipeline 或新 dependency。
