# Three-subject learning studios

## Problem

The child experience currently works as a focused English lesson, but Mathematics and Chinese Language Arts are not available in the same simple flow. Bringing back the former world navigation would make the product harder to understand and would not add learning evidence.

## Product decision

Keep one lesson-first product with three subject studios:

- English: listen to and build `CAT`.
- Mathematics: build `34` from tens and ones.
- Chinese Language Arts: arrange `ㄇ`、`ㄧ`、`ˇ` to connect the Zhuyin sequence with `米`.

Each studio uses the same four surfaces: Today, interactive lesson, a compact 2D growth path, and a parent skill map. Only one subject and one primary action appear at a time. English remains the default. The 3D world is not part of this flow.

## Curriculum model

The existing computable model remains the source of truth:

`Topic DAG -> prerequisite check -> recommendation -> lesson evidence -> LearnerTopicState -> next recommendation`

English and Mathematics retain their existing Growth Planet and Marble-derived references. Chinese Language Arts is a first-party Growth Planet curriculum extension aligned to Taiwan's 108 Curriculum Guidelines; it must never be attributed to Marble.

The first Chinese path contains exactly three nodes:

1. `tw_zh_g1_zhuyin_symbols` — recognize Zhuyin symbols and tone marks.
2. `tw_zh_g1_zhuyin_blending` — arrange symbols into a complete syllable.
3. `tw_zh_g1_zhuyin_word_link` — connect pronunciation, character, and meaning.

The first dependency is hard and the second is soft. The topic split, dependency strength, example words, and lesson pacing are product interpretations, not official prescribed sequencing.

Official reference: Taiwan Ministry of Education / National Academy for Educational Research, 12-year Basic Education Curriculum Guidelines, Chinese Language Arts, learning performance `3-I-1`, `3-I-2`, `4-I-1` and learning content `Aa-I-1` through `Aa-I-4`, `Ab-I-1`, `Ab-I-5`. Official source: https://www.naer.edu.tw/PageSyllabus?fid=177

## Child experience

- Header offers native-button subject switching for English, Mathematics, and Chinese Language Arts.
- Today shows one recommendation, one interactive model preview, and one filled call to action.
- Lesson mode prevents subject switching until the child returns.
- Growth shows only the active subject's three-node prerequisite path.
- Status is communicated with text and icons, never colour alone.

## Parent experience

- Show only the active subject's three-node curriculum slice.
- Show mastered count, recommendation reason, one-line evidence, and mastery bar.
- Put attempts, hints, and retries inside native `details` disclosure.
- Make the recommended lesson the only filled call to action.
- Attribution must distinguish the Growth Planet path from the imported Marble snapshot.

## Data safety and migration

- Bump local progress to version 4 without changing the storage key.
- Reconcile stored topic states by topic ID.
- Preserve all valid v3 English and Mathematics mastery, attempts, missions, XP, alias, framework, and timestamp.
- Initialize only newly added Chinese topic states at zero.
- Continue to collect no child email, legal name, voice, location, school, or birthday.
- Browser speech is optional playback only; visible text must keep the lesson playable when speech is unavailable.

## Visual direction

Reuse the existing paper, ink, editorial layout and asymmetric corner. Do not add gradients, glow, a game lobby, a new animation system, or a second UI language.

- English accent: blue `#315FCA`.
- Mathematics accent: ochre `#9A4B12`.
- Chinese Language Arts accent: green `#2F6B4F`.
- Inactive subjects and graph connectors remain neutral.

## Acceptance criteria

- English, Mathematics, and Chinese Language Arts can each be selected from Today, Growth, and Parent views.
- Each subject launches the correct interactive starter lesson.
- Each subject has a three-node computable 2D path derived from local topic and dependency data.
- Parent view updates its mastery, evidence, dependency labels, and recommendation with the active subject.
- The Chinese lesson records deterministic hint, retry, and correct evidence.
- A v3 record with English and Mathematics mastery migrates to v4 without losing any stored value; three Chinese states are added at zero.
- Mathematics completion records one attempt per affected topic rather than duplicate attempts.
- The Marble importer, snapshot, and explorer remain Mathematics and English only.
- Subject controls expose pressed state, path exposes current step, focus remains visible, touch targets are at least 44 px, and all actions have keyboard equivalents.
- 390 x 844, 768 x 1024, and 1440 x 900 have no horizontal overflow or console errors.
- `npm run check`, `npm audit --audit-level=high`, and browser verification pass.

## Out of scope

- China Simplified Chinese / Pinyin content overlay.
- Additional interactive lessons beyond one starter lesson per subject.
- Reintroducing 3D, game-world, XP, store, leaderboard, or daily-reward navigation.
- Backend progress sync, analytics, microphone recording, or AI-generated assessment content.
- Changes to the imported Marble Mathematics and English dataset.
