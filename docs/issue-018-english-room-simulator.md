# Issue 018 — 把英文位置課改成可操作的房間模擬器

## Problem

英文第 8 課目前仍是通用卡片流程。孩子可以把 `It is under the chair.` 排對，卻不必先理解物品位置真的改變了什麼。

Marble 的 [Ecosystem Simulator](https://withmarble.com/ecosystem-simulator) 把學習放進一個可操作的系統：先給任務，再讓孩子改變狀態、觀察結果，最後從結果理解關係。Oshiami 應採用這個互動模型，但不複製 Marble 的程式碼、資產、品牌或生態內容。

## Product decision

- 不新增科學學科；先把現有英文 `tw_eng_g1_prepositions` 做深。
- 第 8 課改為「找書包」房間模擬器：孩子把書包移到椅子的 `on / under / next to` 三個位置。
- 場景即時顯示現在的位置與英文關係；任務先比較 `under` 與 `on`，再回到 `under` 組成 `It is under the chair.`。
- Canvas/視覺場景只負責表現；原生按鈕提供完整等價操作，鍵盤、觸控與無動效模式都能完成。
- 只有正確場景狀態加上完成句子流程才記錄 mastery evidence。提示與錯誤嘗試仍影響既有掌握度計算。

## Acceptance criteria

- taxonomy recommendation 到第 8 課時載入專用 room simulator，其他 9 堂課不變。
- 書包至少有 `on / under / next to` 三個 deterministic 狀態；孩子先完成 `under`，再用 `on` 做對照；Reset 可回到該任務的初始狀態。
- 自由移動不計 retry；只有在錯誤位置按下「檢查位置」才增加 retry。要求提示會增加 hint，兩個位置任務都正確後才能進入句子、開口與複習流程。
- 畫面、HTML 控制與 live status 對同一位置狀態保持一致。
- 所有控制都有 accessible name、可見 focus、原生鍵盤操作；不依賴拖曳或 hover。
- 動效只使用 transform/opacity、具有停止條件並尊重 `prefers-reduced-motion`；不增加 animation/game dependency。
- taxonomy validator、unit tests、production build、audit、desktop/mobile browser smoke 均通過。

## Harness

- **State surface:** 專用純函式 lesson state + 現有 `LearnerTopicState` / `LearningEvidence`。
- **Execution surface:** React lesson component、原生按鈕、CSS 視覺場景。
- **Feedback signals:** unit tests、`npm run check`、`npm audit --audit-level=high`、Chrome desktop/mobile screenshots 與互動 smoke。
- **Convergence:** 三個位置可重現；錯誤/提示計數正確；正確任務才能完成；無回歸。
- **Human boundary:** 可本地 commit；merge、deploy、外部發佈仍需明確授權。

## Receipts

- **Work type:** feature；不是 unattended loop。
- **Dynamic harness:** off；一個專用狀態機與 deterministic verifier 足夠。
- **Context risk:** monitor；僅使用公開 reference 與本 repo 英文課相關檔案。
- **Reference policy:** 模仿互動原則，不要求視覺或程式碼逐像素一致。
- **Security scan:** `npm audit` + 獨立 scoped code review；不觸及 auth、backend、child data 或 network input。
- **Complexity gate:** 使用既有 React/CSS/Phosphor；不新增 Pixi scene、router、global state、physics 或 animation library。
- **Out of scope:** 科學 taxonomy、真正生態數值模型、語音辨識、自由拖曳、AI 生成題目、家長帳號與 Supabase。
- **Do not touch:** Privy/auth、family account、progress namespace、taxonomy import snapshot、數學與語文課。
