# Oshiami

一個給華語低年級孩子的互動學習產品。孩子直接在英文、數學與語文三個學習室開始一堂短課，不需要先理解遊戲地圖。

線上體驗：[growth-planet-learning.vercel.app](https://growth-planet-learning.vercel.app/)

## 現在可以玩什麼

- 英文互動課：從 CAT、`My name is Mia` 出發，沿著 10 個生活情境練到問位置、描述物品與說明喜歡的理由
- 數學互動課：用 PixiJS 或等價按鈕蓋出 34，把十個一換成一個十
- 語文互動課：聽「米」，依序排入 ㄇ、ㄧ、ˇ
- 30 個本地課程能力各自記錄答對、提示、重試與掌握度，並依 prerequisite DAG 推薦下一步
- 「我的成長」只顯示目前學科的 2D 能力路徑；英文為 12 個能力，數學與語文各聚焦 3 個起步能力
- 家長技能圖顯示前置關係、掌握度、可觀察證據與下一堂推薦
- 698 個 12 歲以前數學與英文概念的 Marble 篩選快照仍保留在資料層與進階探索元件
- 家長登入介面已接好 Privy；未設定 App ID 時維持完整可玩的訪客模式
- 孩子只需要暱稱，不要求真實姓名或 email

## 本機啟動

```bash
npm install
npm run dev
```

完整驗證：

```bash
npm run check
npm audit --audit-level=high
```

## 啟用 Privy

1. 在 Privy 建立 Web App。
2. 複製 `.env.example` 為 `.env.local`。
3. 設定 `VITE_PRIVY_APP_ID`，並把正式網域加入 Privy allowed origins。
4. 重新建置或部署。

Privy 只負責家長 email／Google 登入。v1 不建立錢包、不收集孩子 email，學習進度仍只保存在裝置上。

## 課程圖

資料層保留 [Marble Skill Taxonomy v1](https://github.com/withmarbleapp/os-taxonomy) 的篩選產出：Mathematics 與 English 且 `ageRangeEnd <= 12` 的 topics，以及兩端都存在的 dependency edges。精確 upstream commit、產生方法、歸屬與授權見 `docs/taxonomy-reference.md` 與 `THIRD_PARTY_NOTICES.md`。

語文是 Oshiami 自建的三節點課程圖，採用相同的 topic、evidence、assessment、dependency 與 LearnerTopicState 資料形狀，並對照台灣 108 國語文課綱代碼；它不屬於 Marble 快照。官方 locator 與產品解讀界線見 `src/data/chinese-curriculum-standards.json` 與 `docs/issue-011-three-subject-learning-studios.md`。

英文起步課從 Marble 快照選出 12 個來源能力，另外建立 Oshiami 的窄化對應、生活情境與在地課程序列。Marble 提供能力來源，不代表這 10 個情境或順序由 Marble 背書；完整對應見 `src/data/english-course-overlays.json`。

本地一年級數學另外以 standards overlay 對齊台灣 108 課綱與中國大陸 2022 課標；兩地共用同一棵能力 DAG，不複製技能節點。lesson-content overlay 可載入台灣繁中／新台幣或中國簡中／人民幣內容，切換框架不會重置能力進度；目前三科介面預設使用台灣內容。資料形狀、來源、編碼政策與教研邊界見 `docs/curriculum-overlay-tw-cn.md` 與 `docs/issue-009-tw-cn-lesson-content-overlay.md`。

## v1 邊界

目前英文有 10 堂循序生活情境課，數學與語文各有一堂，不代表全部能力都已完成教材化。芽芽目前是確定性提示與推薦，不會自由生成題目。雲端跨裝置同步、生成式 AI 導師、付款與社交功能都留待真實孩子測試後再決定。
