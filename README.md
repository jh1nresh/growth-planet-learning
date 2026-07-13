# 成長星球 Growth Planet

一個給 12 歲以前華語孩子的互動學習世界。v1 先把台灣一年級數學做成可完成的「數學大陸」，並開放第一條「英文港口」航線。

線上體驗：[growth-planet-learning.vercel.app](https://growth-planet-learning.vercel.app/)

## 現在可以玩什麼

- 孩子首頁直接顯示今天推薦的一課，以及芽芽推薦這一課的原因
- PixiJS「位值塔」讓孩子拖曳或按鍵操作積木，把十個一換成一個十
- 18 個本地課程能力各自記錄答對、提示、重試與掌握度，並依 hard prerequisite 推薦下一課
- 「我的成長」保留可旋轉、平移與縮放的 3D 星球進度總覽
- 家長技能圖可拖曳旋轉、右鍵平移、滾輪縮放，並顯示孩子掌握摘要
- 同時探索 698 個數學與英文概念，範圍為 12 歲以前
- 切換科目，按年齡高度觀察概念，並沿著 1,326 條先修關係探索
- 點選概念查看說明、學會的證據、直接先修與後續解鎖概念
- WebGL 不可用時，仍可用原生鍵盤概念選單瀏覽全部資料
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

主技能圖直接使用 [Marble Skill Taxonomy v1](https://github.com/withmarbleapp/os-taxonomy) 的篩選產出資料：保留 Mathematics 與 English，且 `ageRangeEnd <= 12` 的 topics，再保留兩端都存在的 dependency edges。精確 upstream commit、產生方法、歸屬與授權見 `docs/taxonomy-reference.md` 與 `THIRD_PARTY_NOTICES.md`。

本地一年級數學另外以 standards overlay 對齊台灣 108 課綱與中國大陸 2022 課標；兩地共用同一棵能力 DAG，不複製技能節點。孩子首頁可選台灣繁中／新台幣或中國簡中／人民幣內容，切換只載入 lesson-content overlay，不重置能力進度。資料形狀、來源、編碼政策與教研邊界見 `docs/curriculum-overlay-tw-cn.md` 與 `docs/issue-009-tw-cn-lesson-content-overlay.md`。

## v1 邊界

目前只有「位值塔」完成互動教材化，不代表所有 4–12 歲課程都已變成可操作課程。芽芽目前是確定性提示與推薦，不會自由生成題目。雲端跨裝置同步、生成式 AI 導師、付款與社交功能都留待真實孩子測試後再決定。
