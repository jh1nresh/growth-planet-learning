# 台灣／中國大陸可計算課程底層 v1

## 決策

不複製兩棵內容相同的技能樹。產品使用一棵 canonical micro-topic DAG，課綱作為 standards overlay：

```text
canonical topics + prerequisite DAG
              ├─ Taiwan 108 standard keys
              └─ China 2022 standard keys
                         ↓
             jurisdiction + grade filter
                         ↓
                LearnerTopicState
                         ↓
            next topic + readable reason
```

這沿用 Marble Skill Taxonomy 的資料形狀：topic 保留 `evidence`、`assessmentPrompt` 與 `standards` keys，dependency 保留 `hard`／`soft` 與 reason；standard keys 指向獨立的 `curriculum-standards.json`。Marble 的公開資料是 taxonomy，不含 learner runtime；本 repo 的 mastery/recommendation engine 是產品層。

## 官方來源與編碼政策

### 台灣

- 來源：[國家教育研究院課程綱要入口](https://stv.naer.edu.tw/teaching/course_outline.jsp)
- 數學細目使用官方代碼，例如 `N-1-1`、`N-1-2`、`S-1-2`。
- v1 只對齊國小一年級數學，alignment status 為 `verified`。

### 中國大陸

- 來源：[教育部《義務教育數學課程標準（2022 年版）》](https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582346895190.pdf)
- 官方以「第一學段（1～2 年級）」與內容要求組織，沒有台灣式逐條代碼。
- `stage1.NU.1` 等值是本產品的穩定 source locator，不宣稱是官方 code；`codeOrigin` 必須是 `internal-locator`。
- 把第一學段內容放入一年級只是產品編排假設，因此 alignment status 為 `provisional`，需由熟悉人教版／各地實施進度的教研者審核。
- 第一學段雖涵蓋 1～2 年級，v1 的 `implementedGrades` 仍只有一年級；系統不會把這 15 個技能誤當成完整二年級課程。

## 授權邊界

- `curriculum-standards.json` 設為 codes-only，不收錄課標全文。
- 官方文本的授權條件由 upstream source 管理；未完成權利審核前不批量重製。
- Marble database 結構與 topic／dependency 關係受 ODbL 1.0；Marble 撰寫文字受 CC BY-SA 4.0。產品必須保留既有 attribution，對 taxonomy 本身的衍生改進遵守 share-alike。

## 已完成的第一批

- 15 個台灣一年級數學 micro-topics 全部具有 `tw-108-math:*` 與 `cn-2022-math:*` alignment。
- `getCurriculumGraph(frameworkSlug, grade)` 會取出對應 topics、dependency edges 與 standards，並依 DAG 排序。
- `getCurriculumRecommendation(...)` 在選定課綱後重用相同 LearnerTopicState／hard prerequisite 引擎。
- validator 阻止未知 standard、缺少任一地區 alignment、重複 key、topicCount 漂移與意外收錄官方全文。

## 尚未宣稱完成

- 中國大陸一年級的教材順序、人民幣素材與簡體中文 lesson copy 尚未完成教研審核。
- 台灣與大陸目前共用 canonical skill；內容、例題、貨幣與語言變體必須另做 lesson-content overlay，不能只切換課綱標籤。
- 國語文／英語／自然與二年級以上尚未匯入。
