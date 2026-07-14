# Oshiami

一個給華語低年級孩子的互動學習產品。孩子直接在英文、數學與語文三個學習室開始一堂短課，不需要先理解遊戲地圖。

線上體驗：[growth-planet-learning.vercel.app](https://growth-planet-learning.vercel.app/)

## 現在可以玩什麼

- 英文互動課：聽 CAT，依聲音順序放入 C、A、T
- 數學互動課：用 PixiJS 或等價按鈕蓋出 34，把十個一換成一個十
- 語文互動課：聽「米」，依序排入 ㄇ、ㄧ、ˇ
- 21 個本地課程能力各自記錄答對、提示、重試與掌握度，並依 prerequisite DAG 推薦下一步
- 「我的成長」只顯示目前學科的三節點 2D 能力路徑
- 家長技能圖顯示前置關係、掌握度、可觀察證據與下一堂推薦
- 698 個 12 歲以前數學與英文概念的 Marble 篩選快照仍保留在資料層與進階探索元件
- 家長透過 Privy 登入；每位孩子使用獨立暱稱、內建頭像與 4 位數 PIN，不要求孩子 email
- 家長登入過的瀏覽器會成為家庭授權裝置，孩子可直接選帳號並輸入 PIN
- 家庭後端啟用後，孩子進度依帳號跨授權裝置同步；訪客進度仍只留在本機

## 本機啟動

```bash
npm install
npm run dev
```

完整驗證：

```bash
npm run check
npm run test:family-db
npm audit --audit-level=high
```

## 啟用家庭帳號

1. 在 Privy 建立 Web App。
2. 複製 `.env.example` 為 `.env.local`。
3. 設定 `VITE_PRIVY_APP_ID` 與同值的伺服器端 `PRIVY_APP_ID`，並把正式網域加入 Privy allowed origins。
4. 建立 Supabase 專案並套用 `supabase/migrations/20260713083000_family_accounts.sql`。
5. 設定 `SUPABASE_URL`、伺服器專用的 `SUPABASE_SECRET_KEY`，以及至少 32 字元的 `OSHIAMI_SESSION_PEPPER`。
6. 重新建置或部署。

Privy 只負責家長 email／Google 登入。Oshiami 不替孩子建立 Privy 帳號、不建立錢包，也不收集孩子 email。瀏覽器不會收到 Supabase secret、PIN 雜湊或工作階段雜湊；未設定家庭後端時會安全退回訪客模式。

## 課程圖

資料層保留 [Marble Skill Taxonomy v1](https://github.com/withmarbleapp/os-taxonomy) 的篩選產出：Mathematics 與 English 且 `ageRangeEnd <= 12` 的 topics，以及兩端都存在的 dependency edges。精確 upstream commit、產生方法、歸屬與授權見 `docs/taxonomy-reference.md` 與 `THIRD_PARTY_NOTICES.md`。

語文是 Oshiami 自建的三節點課程圖，採用相同的 topic、evidence、assessment、dependency 與 LearnerTopicState 資料形狀，並對照台灣 108 國語文課綱代碼；它不屬於 Marble 快照。官方 locator 與產品解讀界線見 `src/data/chinese-curriculum-standards.json` 與 `docs/issue-011-three-subject-learning-studios.md`。

本地一年級數學另外以 standards overlay 對齊台灣 108 課綱與中國大陸 2022 課標；兩地共用同一棵能力 DAG，不複製技能節點。lesson-content overlay 可載入台灣繁中／新台幣或中國簡中／人民幣內容，切換框架不會重置能力進度；目前三科介面預設使用台灣內容。資料形狀、來源、編碼政策與教研邊界見 `docs/curriculum-overlay-tw-cn.md` 與 `docs/issue-009-tw-cn-lesson-content-overlay.md`。

## v1 邊界

目前每科只有一堂起步互動課，不代表全部能力都已完成教材化。芽芽目前是確定性提示與推薦，不會自由生成題目。家庭帳號第一版採單一家長、最多 8 位孩子與授權裝置模式；共同家長、教師帳號、生成式 AI 導師、付款與社交功能仍留待真實家庭測試後再決定。
