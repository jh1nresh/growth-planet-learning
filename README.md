# 成長星球 Growth Planet

一個給 12 歲以前華語孩子的互動學習世界。v1 先把台灣一年級數學做成可完成的「數學大陸」，並開放第一條「英文港口」航線。

線上體驗：[growth-planet-learning.vercel.app](https://growth-planet-learning.vercel.app/)

## 現在可以玩什麼

- 拖曳旋轉、右鍵平移、滾輪縮放 3D 技能關係圖
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

## v1 邊界

目前是可探索的技能關係圖，不代表所有 4–12 歲課程都已變成可完成的任務。雲端跨裝置同步、AI 導師、付款、社交與家長儀表板都留待真實孩子測試後再決定。
