import type {Subject} from '../../types';

export type LearningSubject = Extract<Subject, 'English' | 'Mathematics' | 'Chinese'>;

export interface LearningStudio {
  subject: LearningSubject;
  label: string;
  studioLabel: string;
  mark: string;
  topicIds: readonly [string, string, string];
  lessonTopicId: string;
  lessonEvidenceTopicIds: readonly string[];
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
  pathEyebrow: string;
  pathTitle: string;
  pathDescription: string;
  lessonName: string;
  sourceLabel: string;
  sourceUrl: string;
}

export const LEARNING_SUBJECTS: LearningSubject[] = ['English', 'Mathematics', 'Chinese'];

export const learningStudios: Record<LearningSubject, LearningStudio> = {
  English: {
    subject: 'English',
    label: '英文',
    studioLabel: 'English Studio',
    mark: 'A',
    topicIds: ['tw_eng_g1_letter_sounds', 'tw_eng_g1_sight_words', 'tw_eng_g1_greetings'],
    lessonTopicId: 'tw_eng_g1_letter_sounds',
    lessonEvidenceTopicIds: ['tw_eng_g1_letter_sounds'],
    duration: '約 4 分鐘',
    domain: 'PHONICS · 字母與起始音',
    headlineLead: '聽一聽，',
    headlineFocus: 'CAT',
    headlineTail: '拼出',
    description: '先聽單字，再把三個字母放到正確位置。每一次操作，都會留下孩子真正理解的學習證據。',
    masteredReason: '你已經把 C、A、T 和聲音接起來了；今天用一輪短複習，讓它變得更穩。',
    lessonAction: '開始這一課',
    replayAction: '再練一次',
    steps: ['聽完整單字 CAT', '依聲音選 C、A、T', '看見字母組成真正的單字'],
    masteryLabel: '字母與起始音掌握度',
    previewLabel: '單字 CAT 由 C、A、T 三個字母組成',
    previewCaption: '聽 /kæt/ · 找字母 · 拼成單字',
    pathEyebrow: '我的英文成長',
    pathTitle: '從聲音，走到第一句話',
    pathDescription: '先把聲音和字母接起來，再辨認常見字並使用第一句招呼。',
    lessonName: 'CAT 互動課',
    sourceLabel: '底層架構參考 Marble；三節點路徑由 Oshiami 編排',
    sourceUrl: 'https://github.com/withmarbleapp/os-taxonomy',
  },
  Mathematics: {
    subject: 'Mathematics',
    label: '數學',
    studioLabel: 'Math Studio',
    mark: '10',
    topicIds: ['tw_math_g1_count_20', 'tw_math_g1_bundle_ten', 'tw_math_g1_tens_ones'],
    lessonTopicId: 'tw_math_g1_bundle_ten',
    lessonEvidenceTopicIds: ['tw_math_g1_count_20', 'tw_math_g1_bundle_ten', 'tw_math_g1_tens_ones'],
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
    pathEyebrow: '我的語文成長',
    pathTitle: '從注音，走到第一個短句',
    pathDescription: '先辨認注音符號，再練習拼讀，最後把讀音、國字和意思連起來。',
    lessonName: '米的注音互動課',
    sourceLabel: '對照台灣 108 國語文課綱；三節點路徑由 Oshiami 編排',
    sourceUrl: 'https://www.naer.edu.tw/PageSyllabus?fid=177',
  },
};
