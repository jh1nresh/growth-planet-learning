import type {MissionQuestion} from '../types';

export type TutorEvent =
  | {type: 'option-selected'; questionId: string; option: string; occurredAt: string}
  | {type: 'hint-requested'; questionId: string; occurredAt: string}
  | {type: 'answer-checked'; questionId: string; correct: boolean; occurredAt: string};

export type TutorMove = {
  kind: 'wait' | 'acknowledge' | 'hint' | 'scaffold' | 'celebrate';
  message: string;
};

export function appendTutorEvent(events: TutorEvent[], event: TutorEvent) {
  return [...events, event];
}

export function getAttemptCount(events: TutorEvent[], questionId: string) {
  return events.filter((event) => event.type === 'answer-checked' && event.questionId === questionId).length;
}

export function getTutorMove(
  question: MissionQuestion,
  events: TutorEvent[],
  selectedOption: string | null,
  checked: boolean,
  locale: 'zh-TW' | 'zh-CN' = 'zh-TW',
): TutorMove {
  const latest = [...events].reverse().find((event) => event.questionId === question.id);
  const attempts = getAttemptCount(events, question.id);
  const china = locale === 'zh-CN';

  if (checked && selectedOption === question.correctOption) {
    return {kind: 'celebrate', message: `你找到方法了！${question.explanation}`};
  }

  if (checked) {
    return attempts <= 1
      ? {kind: 'hint', message: `先不公布答案。提示：${question.hint}`}
      : {kind: 'scaffold', message: china
        ? `我们把问题缩小一点：${question.hint} 再比较一次你选的答案。`
        : `我們把問題縮小一點：${question.hint} 再比較一次你選的答案。`};
  }

  if (latest?.type === 'hint-requested') {
    return {kind: 'hint', message: `${china ? '可以，给你一小步' : '可以，給你一小步'}：${question.hint}`};
  }

  if (selectedOption) {
    return {kind: 'acknowledge', message: china ? '你已经做出选择了。先说说看，你是怎么想到的？' : '你已經做出選擇了。先說說看，你是怎麼想到的？'};
  }

  return {kind: 'wait', message: china ? '我先不说答案。慢慢看题目，找出最重要的数字或线索。' : '我先不說答案。慢慢看題目，找出最重要的數字或線索。'};
}
