# Issue 009 — 台灣／中國一年級 lesson-content overlay

## PM Gate

- **Repo:** `growth-planet-learning`
- **Problem:** 現有 `standards` overlay 能計算課綱對齊，實際教材文字、貨幣、例題與互動提示仍固定為台灣繁中；切換中國課標不會載入中國教材內容。
- **Goal:** 同一個 canonical `topicId` 與 LearnerTopicState，能確定性載入台灣繁中／新台幣或中國簡中／人民幣內容。
- **Work type:** feature；不是 unattended loop。
- **Acceptance criteria:**
  - TW 與 CN 共用 topic IDs、dependencies、mastery 與 completed missions。
  - 15 個現有一年級數學 topics 均能載入中國簡中內容與可追溯的教研 placement。
  - 8 個數學 missions 與「位值塔」可載入對應地區文字；人民幣與新台幣不混用。
  - 教材版本偏好在本機保存，舊 v1／v2 progress 可遷移且不遺失。
  - 中國 placement 區分 `verified`、`provisional`、`supplemental`，不把第一學段或舊版教材證據誤稱為新版一年級定論。
  - UI 使用原生 button、可鍵盤操作、具可讀名稱與清楚 pressed state。
- **Verification:** content invariants、progress migration tests、`npm run check`、`npm audit --audit-level=high`、桌面／手機 browser flow 與 console。
- **Human boundary:** 可開 branch、commit、push、PR；不 merge、不 deploy。
- **Risk:** 中國不是單一教材版本；v1 明確採「2022 課標＋2024 修訂人教版」作為內容 profile，不代表所有省市教材順序。
- **Security scan receipt:** product-code 變更；以 npm audit 與 scoped diff review 驗證。無新依賴、無網路寫入、無兒童資料欄位。
- **Dynamic harness:** off；schema、loader、progress 與 UI 消費端高度耦合，使用 local serial feedback loop。
- **Context risk:** monitor；若跨越內容模型以外的 DAG 重建，停止並另開階段。
- **Out of scope:** 新增缺少的 PEP micro-topics、重排 canonical DAG、二年級、其他教材版本、CMS、雲端同步、英文在地化。
- **Do not touch:** Privy、3D graph、Marble snapshot、英文 mission 內容。

## Product decision frame

- **Decision:** canonical skill 與 learner state 保持地區中立；地區差異只存在 lesson-content overlay。
- **Options considered:** 複製兩棵課程樹；導入完整 i18n framework；JSON overlay。
- **Chosen tradeoff:** JSON overlay，可追溯且不新增 runtime dependency。
- **Rejected alternative:** 複製 TW／CN topic IDs，會把同一能力的進度切成兩份；只做字形轉換，會漏掉貨幣、例題與教材編排差異。
- **Expected outcome:** 切換教材版本只改內容，不重置 mastery；未來可增加更多教材 profile。
- **Verification:** 同 topic ID differential tests、progress state equality、browser read-back。

## Harness

- **State surface:** `topics.json`／`missions.json` canonical data、lesson overlay JSON、progress v3、App／MissionDialog／PlaceValueLesson。
- **Execution surface:** Vitest、taxonomy validator、TypeScript/Vite build、local browser。
- **Feedback signals:** schema tests、migration tests、rendered copy、currency read-back、console errors、scoped diff review。
- **Convergence:** 全部 acceptance criteria 通過且 structured review 無 accepted finding。
- **Reference policy:** 官方來源決定課標與新版人教 placement；產品文案可有多個正確版本，但必須符合語體、貨幣與 concept invariants。
- **Component signal:** content/source、loader/schema、state migration、UI consumption 分別驗證，避免只看端到端畫面。
- **Context boundary:** 使用公開課綱、公開教材介紹與本 repo；無 secret、私人兒童資料或 provider upload。

## 中國一年級教研審核 v1

官方 2022 課標只定義第一學段（1～2 年級），因此一年級 placement 另以 2024 修訂人教版證據判定：

| 現有能力 | 新版人教 placement | 狀態 | 判定 |
|---|---|---|---|
| 數到 20 | 上冊第四單元「11～20 的認識」 | verified | 教育部 2024 部級精品課清單可回讀 |
| 數到 100 | 下冊候選 | provisional | 舊版官方課例可定位，新版下冊目錄尚未取得 |
| 十個一換成一個十 | 上冊第四單元「10 的再認識」 | verified | 教育部 2024 部級精品課清單可回讀 |
| 十位與個位 | 上冊第四單元「11～20 的認識」 | verified | 位值內容可直接對齊 |
| 零是佔位者 | 下冊 100 以內位值候選 | provisional | 課標支持，但新版一年級 placement 未完全確認 |
| 比較兩位數 | 下冊候選 | provisional | 舊版官方課例可定位，新版下冊待確認 |
| 十的好朋友 | 上冊第二單元「6～10 的認識和加、減法」 | verified | 有「組成」官方課例 |
| 20 以內加法 | 上冊第五單元「20 以內的進位加法」 | verified | 2024 新版單元與課例已確認 |
| 20 以內減法 | 下冊候選 | provisional | 退位減法新版 placement 待確認 |
| 平面圖形 | 下冊候選 | provisional | 新版上冊明確先學立體圖形 |
| 立體圖形 | 上冊第三單元「認識立體圖形」 | verified | 2024 新版單元與課例已確認 |
| 長度比較 | 第一學段延伸 | supplemental | 課標涵蓋測量，未取得新版一年級單元證據 |
| 整點時間 | 舊版一年級內容延伸 | supplemental | 2024 新版上冊目錄未列時間單元 |
| 人民幣 | 下冊候選 | provisional | 舊版官方課例可定位，新版下冊待確認 |
| 綜合複習 | 上冊第六單元「復習與關聯」 | verified | 新版教材介紹與官方課例可確認 |

### 已知 coverage gap

現有 15 topics 不是完整的人教一年級課程：缺少 5 以內、6～10 的細粒度數認識與加減 micro-topics。現有 hard prerequisite `數到 20 → 十的分與合` 也不等於人教教學順序。本階段只建立可載入、可審核的內容層；DAG 拆分與重排需在下一個課程建模 PR 處理。

### 官方來源

- [教育部《義務教育數學課程標準（2022 年版）》](https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582346895190.pdf)
- [教育部 2024 年「基礎教育精品課」部級名單](https://www.moe.gov.cn/jyb_xxgk/s5743/s5744/A06/202506/W020250625697282575780.pdf)
- [人民教育出版社：人教版義務教育數學新教材簡介](https://www.pep.com.cn/xw/zt/hd/12/xjcjs/xx/202409/t20240920_1995566.html)
- [教育部 2024 年義務教育國家課程教學用書目錄](https://www.moe.gov.cn/srcsite/A26/s8001/202408/W020250418502592948423.pdf)
