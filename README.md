# 成長星球 Growth Planet

一個給 12 歲以前華語孩子的互動學習世界。v1 先把台灣一年級數學做成可完成的「數學大陸」，並開放第一條「英文港口」航線。

線上體驗：[growth-planet-learning.vercel.app](https://growth-planet-learning.vercel.app/)

## 現在可以玩什麼

- 拖曳、滾輪／觸控縮放、方向按鈕操作 3D 星球
- 完成 8 個數學區域：數數、十個一、位值、比較、20 以內加減、圖形、測量與總複習
- 完成任務後依序解鎖下一站，進度留在目前裝置
- 進入英文港口，開始第一個字母與起始音任務
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

課程資料採用 topic、dependency、cluster、mission、world region 分層。結構參考 [Marble Skill Taxonomy v1](https://github.com/withmarbleapp/os-taxonomy)，但所有台灣課程 ID、名稱、內容與題目均為本專案原創。詳細歸屬與映射見 `docs/taxonomy-reference.md`。

## v1 邊界

「完整數學大陸」指完整且可玩的台灣一年級垂直切片，不是假裝完成 4–12 歲全部課綱。二年級以上、雲端跨裝置同步、AI 導師、付款、社交與家長儀表板都留待真實孩子測試後再決定。
