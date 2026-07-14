import type {LearnerTopicState, Subject} from '../../types';
import {
  ENGLISH_COURSE_TOPIC_IDS,
  englishCourseScenarios,
  getEnglishCourseSelection,
  type EnglishCourseScenario,
  type EnglishLessonKind,
} from '../english/englishCourse';

export type LearningSubject = Extract<Subject, 'English' | 'Mathematics' | 'Chinese'>;

export interface LearningStudio {
  subject: LearningSubject;
  label: string;
  studioLabel: string;
  mark: string;
  topicIds: readonly string[];
  lessonTopicId: string;
  lessonEvidenceTopicIds: readonly string[];
  lessonKind: EnglishLessonKind | null;
  duration: string;
  domain: string;
  headlineLead: string;
  headlineFocus: string;
  headlineTail: string;
  description: string;
  masteredReason: string;
  lessonAction: string;
  replayAction: string;
  steps: readonly [string, string, string];
  masteryLabel: string;
  previewLabel: string;
  previewCaption: string;
  previewScene: string;
  previewModelText: string;
  previewTranslation: string;
  pathEyebrow: string;
  pathTitle: string;
  pathDescription: string;
  lessonName: string;
  sourceLabel: string;
  sourceUrl: string;
}

export const LEARNING_SUBJECTS: LearningSubject[] = ['English', 'Mathematics', 'Chinese'];

export function getEnglishStudioForScenario(scenario: EnglishCourseScenario): LearningStudio {
  const wordLesson = scenario.kind === 'word';
  const speakingLesson = scenario.kind === 'speaking';
  const roomLesson = scenario.kind === 'room';
  return {
    subject: 'English',
    label: '英文',
    studioLabel: 'English Studio',
    mark: 'A',
    topicIds: ENGLISH_COURSE_TOPIC_IDS,
    lessonTopicId: scenario.primaryTopicId,
    lessonEvidenceTopicIds: scenario.evidenceTopicIds,
    lessonKind: scenario.kind,
    duration: '約 4 分鐘',
    domain: wordLesson
      ? 'PHONICS · 字母與起始音'
      : speakingLesson
        ? 'SPEAKING · 認識新朋友'
        : roomLesson ? 'ROOM LAB · 位置介系詞' : `LIFE ENGLISH · ${scenario.scene}`,
    headlineLead: wordLesson ? '聽一聽，' : speakingLesson ? '等你說完，' : roomLesson ? '移動書包，' : `${scenario.scene}，`,
    headlineFocus: wordLesson ? 'CAT' : roomLesson ? 'UNDER' : scenario.modelText.replace(/[.?]$/, ''),
    headlineTail: wordLesson ? '拼出' : speakingLesson ? '練第一句' : roomLesson ? '看懂' : '說出',
    description: wordLesson
      ? '先聽單字，再把三個字母放到正確位置。每一次操作，都會留下孩子真正理解的學習證據。'
      : speakingLesson
        ? '先辨認 MY、IS，再在一個具體情境中把整句說完。Oshiami 不錄音，也不會在中途打斷。'
        : roomLesson
          ? '先改變書包的位置，比較 on 與 under，再看著房間排出完整句子。操作結果與英文表達都完成，才留下學習證據。'
        : `先理解「${scenario.translation}」，再把字詞排成完整句子，最後自己說兩次。Oshiami 不錄音，也不評分發音。`,
    masteredReason: `你已經完成「${scenario.title}」；今天用一輪短複習，讓這個生活句型更穩。`,
    lessonAction: wordLesson ? '開始這一課' : roomLesson ? '開始房間實驗' : '開始情境練習',
    replayAction: wordLesson ? '再練一次' : roomLesson ? '再做一次實驗' : '再說一次',
    steps: wordLesson
      ? ['聽完整單字 CAT', '依聲音選 C、A、T', '看見字母組成真正的單字']
      : speakingLesson
        ? ['聽新朋友的問題', '辨認 MY、IS 並完成句子', '說完、看一個重點、再說一次']
        : roomLesson
          ? ['移動書包，比較 on 與 under', '看著房間排出完整句子', '自己說完、看重點、再說一次']
        : ['聽並理解生活情境', '依序排出完整句子', '自己說完、看重點、再說一次'],
    masteryLabel: wordLesson ? '字母與起始音掌握度' : '這個英文能力的掌握度',
    previewLabel: roomLesson ? '移動書包，讓房間與英文一起改變' : `${scenario.scene}：${scenario.modelText}，意思是${scenario.translation}`,
    previewCaption: wordLesson
      ? '聽 /kæt/ · 找字母 · 拼成單字'
      : roomLesson ? '移動位置 · 比較關係 · 說出結果' : '看情境 · 排句子 · 自己說兩次',
    previewScene: scenario.scene,
    previewModelText: scenario.modelText,
    previewTranslation: scenario.translation,
    pathEyebrow: '我的英文成長',
    pathTitle: '十個生活情境，長出十二個英文能力',
    pathDescription: '從聲音、常見字和第一句話出發，再學會問位置、描述物品與說明喜歡的理由。',
    lessonName: scenario.title,
    sourceLabel: 'Marble 能力對應；生活情境與課程序列由 Oshiami 編排',
    sourceUrl: 'https://github.com/withmarbleapp/os-taxonomy',
  };
}

export const learningStudios: Record<LearningSubject, LearningStudio> = {
  English: getEnglishStudioForScenario(englishCourseScenarios[0]),
  Mathematics: {
    subject: 'Mathematics',
    label: '數學',
    studioLabel: 'Math Studio',
    mark: '10',
    topicIds: ['tw_math_g1_count_20', 'tw_math_g1_bundle_ten', 'tw_math_g1_tens_ones'],
    lessonTopicId: 'tw_math_g1_bundle_ten',
    lessonEvidenceTopicIds: ['tw_math_g1_count_20', 'tw_math_g1_bundle_ten', 'tw_math_g1_tens_ones'],
    lessonKind: null,
    duration: '約 6 分鐘',
    domain: 'PLACE VALUE · 數量與位值',
    headlineLead: '動手操作，',
    headlineFocus: '34',
    headlineTail: '蓋出',
    description: '加入單位方塊，親手把十個一綁成一個十，再說明 34 裡的 3 真正代表多少。',
    masteredReason: '你已經用十和一蓋出 34；今天再操作一次，讓數量、綁十與位值連得更穩。',
    lessonAction: '開始蓋 34',
    replayAction: '再蓋一次',
    steps: ['加入單位方塊並數出數量', '把十個一綁成一個十', '說明 34 的 3 代表 30'],
    masteryLabel: '數量與位值掌握度',
    previewLabel: '34 由三個十和四個一組成',
    previewCaption: '數一數 · 綁成十 · 看懂位值',
    previewScene: '位值塔',
    previewModelText: '34',
    previewTranslation: '三個十和四個一',
    pathEyebrow: '我的數學成長',
    pathTitle: '從數量，走到十位與個位',
    pathDescription: '先穩定數量，再親手組成十，最後看懂數字所在位置代表多少。',
    lessonName: '位值 34 互動課',
    sourceLabel: '底層架構參考 Marble；台灣數學路徑由 Oshiami 編排',
    sourceUrl: 'https://github.com/withmarbleapp/os-taxonomy',
  },
  Chinese: {
    subject: 'Chinese',
    label: '語文',
    studioLabel: '語文學習室',
    mark: 'ㄅ',
    topicIds: ['tw_zh_g1_zhuyin_symbols', 'tw_zh_g1_zhuyin_blending', 'tw_zh_g1_zhuyin_word_link'],
    lessonTopicId: 'tw_zh_g1_zhuyin_symbols',
    lessonEvidenceTopicIds: ['tw_zh_g1_zhuyin_symbols'],
    lessonKind: null,
    duration: '約 4 分鐘',
    domain: 'ZHUYIN · 注音符號與聲調',
    headlineLead: '聽讀音，',
    headlineFocus: 'ㄇㄧˇ',
    headlineTail: '排出',
    description: '先聽「米」，再把聲符、介符和聲調排進正確位置，建立注音拼讀的第一個可觀察證據。',
    masteredReason: '你已經能把「米」的注音符號排好；今天用一輪短複習，讓符號和讀音連得更穩。',
    lessonAction: '開始排注音',
    replayAction: '再排一次',
    steps: ['聽完整讀音「米」', '依序選 ㄇ、ㄧ、ˇ', '把注音、國字和意思連起來'],
    masteryLabel: '注音符號掌握度',
    previewLabel: '米的注音由 ㄇ、ㄧ、ˇ 依序組成',
    previewCaption: '聽讀音 · 排注音 · 找到國字',
    previewScene: '注音學習室',
    previewModelText: 'ㄇㄧˇ',
    previewTranslation: '米',
    pathEyebrow: '我的語文成長',
    pathTitle: '從注音，走到第一個短句',
    pathDescription: '先辨認注音符號，再練習拼讀，最後把讀音、國字和意思連起來。',
    lessonName: '米的注音互動課',
    sourceLabel: '對照台灣 108 國語文課綱；三節點路徑由 Oshiami 編排',
    sourceUrl: 'https://www.naer.edu.tw/PageSyllabus?fid=177',
  },
};

export function getLearningStudio(subject: LearningSubject, states: LearnerTopicState[]): LearningStudio {
  if (subject !== 'English') return learningStudios[subject];
  const selection = getEnglishCourseSelection(states);
  return {
    ...getEnglishStudioForScenario(selection.scenario),
    lessonTopicId: selection.topic.id,
  };
}
