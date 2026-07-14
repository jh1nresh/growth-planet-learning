# Issue 017 — 讓英文能力圖成為可計算、可玩的課程路徑

## Problem

英文孩子端目前只有 CAT 與 `My name is Mia` 兩堂課。Marble taxonomy 已經提供細粒度能力、證據與 prerequisite 來源，但孩子尚未能沿著這套底層持續學習，家長也只能看到三個節點。

## Product decision

- 從本地 Marble 快照選出 12 個 6–8 歲英文能力，每個 Oshiami topic 唯一對應一個來源 topic。
- 以 10 個生活情境承載這 12 個能力；前兩堂保留專用互動，後八堂共用一個小型卡片流程。
- 孩子每次只看到一堂推薦課。Today、2D 成長路徑與家長技能圖使用同一個 prerequisite-aware selection。
- 情境、中文翻譯與課程序列標示為 Oshiami 在地編排，不冒充 Marble 內容或台灣官方英語課綱。
- 課程只記錄意思辨認、句子排序、提示與重試；不錄音、不做發音評分。

## Acceptance criteria

- 12 個英文能力都有唯一 Marble source mapping、LearnerTopicState 與可觀察證據。
- 10 個可玩的生活情境覆蓋全部 12 個能力，且每堂完成只更新宣告的 evidence topics。
- hard prerequisite 未達標時不推薦後續能力；全部掌握後以最後一堂做短複習。
- v4 的 21 個能力進度可無損遷移到 v5 的 30 個能力進度。
- Today、成長路徑與家長技能圖一致顯示同一堂下一課。
- 所有課程都有可見文字 fallback、原生鍵盤控制、觸控操作、focus 狀態與 reduced-motion 相容性。
- taxonomy validator、單元測試、build、browser matrix、audit 與獨立 review 通過。

## Out of scope

- 麥克風、語音辨識、發音分數、自由對話或 LLM 生成題目。
- 數學與語文課程擴充、3D 星球重做、雲端同步、付費與社交功能。
- merge 或 production deploy。
