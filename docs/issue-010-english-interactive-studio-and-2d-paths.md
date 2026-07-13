# Issue 010 — 英文互動教室與 2D 成長路徑

## PM Gate

- **Repo:** `growth-planet-learning`
- **Problem:** 孩子首頁同時承擔學科切換、星球導航與任務入口；成長頁以 3D 星球展示數學地標；家長技能圖一次呈現 698 個概念。三個畫面都讓導航與視覺效果蓋過學習目標，且現有英文任務仍是選擇題。
- **Goal:** 把孩子主流程收斂為英文單科，完成一堂可操作、可記錄學習證據的入門課；以同一棵英文 prerequisite DAG 產生孩子 2D 成長路徑與家長技能圖。
- **Work type:** feature；不是 unattended loop。
- **Acceptance criteria:**
  - 孩子首頁預設只呈現英文今日課程，不載入 3D 星球或 698 節點技能圖。
  - 「拼出 CAT」課程包含聆聽、依序選字母、錯誤回饋、提示、重設與完成狀態；觸控與鍵盤皆可完成。
  - 完成課程後，對 `tw_eng_g1_letter_sounds` 寫入確定性的 correct evidence，並更新 mastery、attempts、hintCount、retryCount 與 mission completion。
  - 成長頁以 2D 顯示 `字母與起始音 → 第一批常見字 → 打招呼與自我介紹`，清楚標示目前、待解鎖與掌握狀態。
  - 家長頁只顯示上述三個能力、依賴關係、掌握度、練習紀錄與下一步推薦原因。
  - 保留現有 topic IDs、dependencies、LearnerTopicState、訪客進度、Privy 邊界與 Marble attribution。
  - 支援手機尺寸、可見 focus、reduced motion、語意化控制與 aria-live 回饋。
- **Verification:** lesson state unit tests、progress integration tests、`npm run check`、`npm audit --audit-level=high`、`git diff --check`、桌機／手機 browser flow、keyboard flow 與 console。
- **Human boundary:** 可開 branch、commit、push、PR；不 merge、不 deploy。
- **Security scan receipt:** 無新依賴、無麥克風、無兒童個資欄位、無新網路寫入；發音只使用瀏覽器 `speechSynthesis`，並提供可讀文字 fallback。
- **Dynamic harness:** off；lesson state、progress hook 與三個 UI surface 緊密耦合，使用 local serial feedback loop。
- **Context risk:** monitor；若需要重寫完整 taxonomy 或數學 curriculum，停止並另開階段。
- **Out of scope:** 新增更多英文課、自由生成題目、語音辨識、刪除數學資料、重建 Marble snapshot、排行榜、商城、merge、deploy。
- **Do not touch:** Privy 設定、TW／CN 數學 content overlay、canonical Marble snapshot、後端同步。

## Product decision frame

- **Decision:** 英文課是孩子預設入口；成長星球改為 2D 個人進度；家長技能圖改為可讀的課程子圖。三者由既有 English topics 與 dependencies 驅動。
- **Reference insight:** [Marble 互動課示範](https://www.threads.com/@bluevelo1666/post/DakpX-DgW_3) 的核心不是 3D，而是「中央一個可操作模型、周邊只顯示當前概念與控制、操作後立即改變狀態」。英文版以聽音與排列字母重現同一教學結構。
- **Options considered:** 繼續精修 3D 星球；把 698 節點圖改色；建立英文互動教室與兩個 2D DAG 視圖。
- **Chosen tradeoff:** 先完成一條只有三個能力的英文 vertical slice。視覺規模更小，但能驗證互動課、mastery evidence 與個人化推薦是否形成閉環。
- **Rejected alternative:** 直接複製參考影片的 3D 分子場景；它沒有幫助孩子理解字母順序，且會增加資產與 WebGL 風險。
- **Expected outcome:** 孩子一進來就知道今天要做什麼；家長可在十秒內看懂孩子會什麼、卡在哪裡、下一步為什麼。

## Design brief

- **Direction:** 溫暖、安靜的英文探索桌；保留想像力，但不像遊戲大廳。
- **Density:** 孩子端 spacious；家長端 compact，每次只呈現三個能力。
- **Surface:** 米白紙面、深藍文字、單一鈷藍 accent；平面層次與細線，不使用裝飾性玻璃或滿版太空。
- **Type mood:** 標題帶故事書感，操作與數據使用清楚 sans-serif；最多三種字重。
- **Motion:** 只用短暫的 opacity／transform 提示操作結果；reduced motion 下關閉。
- **Do:** 一畫面一個主行動、中央可操作教材、立即可見的狀態改變、清楚推薦原因。
- **Don’t:** 698 節點毛線球、卡片套卡片、同半徑套用全頁、多個競爭 accent、以 XP 或光效取代學習回饋。

## Harness

- **State surface:** English topics/dependencies、`useProgress`、lesson state reducer、App screen routing。
- **Execution surface:** Vitest、taxonomy validator、TypeScript/Vite build、local browser。
- **Feedback signals:** reducer invariants、mastery state read-back、rendered DAG order、mobile overflow、focus order、console errors、scoped diff review。
- **Convergence:** acceptance criteria 全部通過，且 structured review 無 accepted finding。
- **Reference policy:** `withmarbleapp/os-taxonomy` 提供 dependency/DAG 架構；Threads 示範只提供互動與資訊層級靈感，不複製其視覺資產。
- **Component signal:** lesson state、progress update、child path、parent view 分別驗證，避免只靠畫面觀感判斷。
- **Context boundary:** 使用公開 reference 與本 repo；不處理 secret、私人兒童資料或 provider upload。

## Complexity gate

- 不新增 package。
- 不為三個節點引入 graph renderer；使用語意化 HTML/CSS。
- 不刪除舊 3D 元件與數學資料，只從本階段的 active routes 移除。
- 不建立通用 lesson authoring framework；本階段只實作 `CAT` vertical slice 與必要的純狀態邏輯。

