import {describe, expect, it} from 'vitest';
import type {MissionQuestion} from '../types';
import {appendTutorEvent, getAttemptCount, getTutorMove, type TutorEvent} from './tutor';

const question: MissionQuestion = {
  id: 'count-1',
  prompt: '27、28、29，下一個數是？',
  options: ['20', '30', '39'],
  correctOption: '30',
  hint: '從 29 再往前數一個。',
  explanation: '29 再往前數一個就是 30。',
};

const checkedWrong = (occurredAt: string): TutorEvent => ({
  type: 'answer-checked',
  questionId: question.id,
  correct: false,
  occurredAt,
});

describe('real-time tutor decisions', () => {
  it('keeps the event trajectory immutable', () => {
    const events: TutorEvent[] = [];
    const next = appendTutorEvent(events, checkedWrong('2026-07-13T00:00:00Z'));
    expect(events).toHaveLength(0);
    expect(next).toHaveLength(1);
  });

  it('waits before giving away an answer', () => {
    expect(getTutorMove(question, [], null, false)).toMatchObject({kind: 'wait'});
  });

  it('gives a hint after the first wrong attempt and scaffolds after the second', () => {
    const first = [checkedWrong('2026-07-13T00:00:00Z')];
    const second = [...first, checkedWrong('2026-07-13T00:00:01Z')];
    expect(getTutorMove(question, first, '20', true)).toMatchObject({kind: 'hint'});
    expect(getTutorMove(question, second, '20', true)).toMatchObject({kind: 'scaffold'});
    expect(getAttemptCount(second, question.id)).toBe(2);
  });

  it('explains only after the learner succeeds', () => {
    const events: TutorEvent[] = [{type: 'answer-checked', questionId: question.id, correct: true, occurredAt: '2026-07-13T00:00:00Z'}];
    const move = getTutorMove(question, events, '30', true);
    expect(move.kind).toBe('celebrate');
    expect(move.message).toContain(question.explanation);
  });
});
