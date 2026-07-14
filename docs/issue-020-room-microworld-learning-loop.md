# Issue 020 — 把 Room Lab 改成可驗證的探索式微世界

## Source finding

[X 貼文](https://x.com/lionel_mora/status/2075522416873242962)本身只提供體驗連結；真正的課程設計存在 [Marble Ecosystem Simulator](https://withmarble.com/ecosystem-simulator) 的互動裡。

已直接觀察到的模式：

- 用「讓生態系存活 100 天」作為單一、可觀察的總任務。
- 世界持續運作，孩子可以 Inspect、Add、Remove、Move、Tune、Break it 與 Reset。
- 介入會立即改變世界狀態；生物數量與健康狀態可能再隨模擬時間產生後續變化。
- `Break it` 把故意破壞系統變成正式學習步驟，再讓孩子觀察連鎖後果。
- `Field guide` 在需要時解釋物件的功能，不先阻斷探索。
- 成功回饋說明「為什麼系統維持平衡」，不是只發 XP 或顯示答對。

因此它的風格不是傳統的「講解 → 選擇題 → 獎勵」，而是 **mission-driven inquiry microworld**：任務驅動、探究式、模型式與因果式學習。更簡單地說，**世界本身就是教材，孩子透過改變世界來理解規則**。

這是依實際互動作出的產品與教學推論；目前沒有獨立學習成效研究可證明它一定優於其他教法。

## Problem

目前 Room Lab 已有原創場景與確定性的 `on / under / next to` 狀態，但核心流程仍是：

```text
指定位置 → 點答案 → 檢查
→ 再指定位置 → 點答案 → 檢查
→ 排句子 → 自行確認朗讀 → 完成
```

孩子可以記住按鈕順序與高亮提示，卻未必理解「介系詞描述兩個物件之間的關係」。更重要的是，目前一次無提示完成會得到 `0.72` mastery，而產品門檻是 `0.7`；如果沒有新物件／新場景的遷移證據，同一張圖上的成功就可能被過早解讀為 mastered。

## Product decision

### Decision

先把一堂英文位置課改成 Oshiami 原創的「會說話的生活微世界」，再擴到其他課程。

### Options considered

1. **只模仿 Marble 視覺**：不能改善學習證據，也有不必要的 IP 風險。
2. **建立完整通用模擬引擎**：對一年級介系詞過度複雜，會增加工具與認知負荷。
3. **一個概念、一個世界規則、兩個遷移測驗**：選用。

### Chosen tradeoff

- v1 只保留 `Move`、`Inspect`、`Reset` 與一張可收起的位置圖卡。
- 不複製生態系、100 天任務、物種、控制列、字體、配色、文案、程式碼或視覺資產。
- 保留 Oshiami 房間、芽芽、華語提示、原創 SVG 與 os-taxonomy 能力節點。
- 不做自由生成題目；答案、提示與 mastery evidence 全部由固定課程規則決定。

### Expected outcome

取得孩子能否在新物品與新家具中正確使用介系詞的行為證據，而不是只記錄同一張圖上「選到 UNDER」。

## Goal

把第 8 課改成以下可驗證循環：

```text
任務
→ 預測
→ 操作世界
→ 即時看見句子與世界是否一致
→ 故意改壞
→ 修復
→ 新物件／新家具遷移
→ 英文回報
→ 寫回能力證據
```

## Lesson contract

### 1. Mission

「幫芽芽整理房間，讓畫面和英文句子一致。」一次只顯示一個主要行動。

### 2. Manipulate the model

- 孩子直接在場景裡移動物品到 `on / under / next to`。
- 位置改變後，畫面與英文句子立即同步。
- 自由探索不算答錯；只有孩子主動提交錯誤結果才增加 retry。

### 3. Inspect

- 點目前物件即可重播單字與完整句子。
- `Field guide` 改成一張原生 `<details>` 圖卡，引導練習時可隨時開啟且不算提示。
- 遷移測驗時收起並停用圖卡；若產品未來允許開啟，該次必須記為 hint。
- 要求「告訴我下一步」會增加 hint。

### 4. Break and repair

- 孩子先預測改動後哪個位置字會改變，再主動啟動一次可逆的「故意改壞」。
- 改動後原句暫時不是真的；孩子觀察結果並修復，而不是只重複相同指令。
- Reset 是實驗工具，不是失敗懲罰。

### 5. Transfer assessment

- 至少兩題，使用不同物品、不同參照物與不同介系詞，例如 `ball / desk / under` 和 `book / shelf / on`；不得只換顏色。
- 兩題都不顯示高亮答案、華語答案或位置圖卡；孩子依英文任務完成位置關係。
- 兩題都完成後才可產生 `correct: true` 的介系詞 evidence，避免一次三選一猜測直接跨過 mastery 門檻。
- 有提示或重試仍可完成，但 mastery 依既有 `hintCount / retryCount` 降低，不直接跨過門檻。

### 6. Report

- 孩子排列或選出正確英文句子，作為顯式語言證據。
- 朗讀保留為可選練習；不錄音、不評分，也不單獨決定 mastered。

## Acceptance criteria

- 場景本身包含可觸控、可鍵盤操作且有可存取名稱的位置控制，不再只依賴場景下方答案列。
- 每次位置操作會同步更新物件、英文句子與任務真值。
- 探索性移動不增加 retry；錯誤提交與提示仍確定性記錄。
- 至少完成一次「預測 → 孩子主動改壞 → 觀察 → 修復」循環。
- 最後包含兩個無鷹架遷移題，使用不同物品、家具與介系詞；兩題都通過前不呼叫 `onComplete`。
- 遷移題不顯示位置圖卡；任何遷移提示都必須寫入 `hintCount`。
- `onComplete` 只呼叫一次，且 evidence 仍寫入 `tw_eng_g1_prepositions`。
- 390 × 844、768 × 1024、1440 × 900 無水平溢出；所有觸控目標至少 44px。
- pointer、touch、keyboard 都能完成；reduced motion 時位置改變不播放位移動畫。
- speech synthesis 不可用時仍能只靠可見文字完成。
- 不新增依賴、Canvas/WebGL、持續動畫、錄音、自由文字或開放式 AI 判分。

## Harness

- **Repo:** `/Users/jhinresh/projects/growth-planet-learning-english-speaking`
- **Baseline:** `7e89cc9`; `npm run check` 為 22 個 test files、100 tests 全數通過，production build 通過；`npm audit --audit-level=high` 為 0 vulnerabilities。
- **State surface:** `EnglishRoomLessonState`、Room Lab UI、Room Lab tests、英文 evidence caller。
- **Execution surface:** React、純函式狀態、既有 Phosphor icons、scoped CSS。
- **Feedback:** state tests、component tests、progress evidence test、三尺寸 browser QA、keyboard/reduced-motion/console checks。
- **Convergence:** 兩個不同的新場景遷移題都是 mastery evidence 的必要條件；完整 check、audit 與獨立設計／可存取性 review 通過。
- **Dynamic harness:** research fan-out 已完成；實作採 local serial，完成後由獨立 checker review。
- **Human boundary:** 可本機實作、驗證與 atomic commit；未經明確指示不 merge、不 deploy、不公開發布。

## Context and security receipt

- **Canonical local source:** 此 issue、Room Lab source/tests、現有 mastery engine。
- **Reference context:** 公開的 Marble 產品頁、課程圖、模擬器與 X 連結。
- **Sensitivity:** reference 為 public；repo context 為 internal；沒有傳遞 secrets、兒童資料或帳號資料。
- **Security for this analysis-only phase:** N/A；沒有 product runtime 變更。實作階段需記錄 changed-file review、無新增網路／資料收集、完整 check 與 audit。

## Out of scope / do not touch

- 不建立完整生態系或通用物理模擬器。
- 不複製 Marble 的品牌、藝術、島嶼、角色、音效、介面排列或程式碼。
- 不修改 taxonomy snapshot、mastery 公式、Privy、Supabase、家庭帳號、數學或語文課程。
- 不把朗讀自我確認當成正確性證據。
- 不在本階段新增排行榜、XP、商城、每日任務或生成式題庫。
