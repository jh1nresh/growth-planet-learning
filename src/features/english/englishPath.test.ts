import {describe, expect, it} from 'vitest';
import {topics} from '../../lib/curriculum';
import {emptyTopicStates} from '../../lib/mastery';
import {buildEnglishPath} from './englishPath';

describe('English path', () => {
  it('maps the existing dependency DAG into three readable stages', () => {
    const path = buildEnglishPath(emptyTopicStates(topics));

    expect(path.map((node) => node.topic.id)).toEqual([
      'tw_eng_g1_letter_sounds',
      'tw_eng_g1_sight_words',
      'tw_eng_g1_greetings',
    ]);
    expect(path.map((node) => node.status)).toEqual(['current', 'upcoming', 'upcoming']);
    expect(path[1].incoming?.prerequisiteId).toBe('tw_eng_g1_letter_sounds');
    expect(path[2].incoming?.strength).toBe('soft');
  });

  it('moves the current marker after mastery', () => {
    const states = emptyTopicStates(topics).map((state) => state.topicId === 'tw_eng_g1_letter_sounds'
      ? {...state, mastery: 0.72, attempts: 1, correctAttempts: 1}
      : state);

    expect(buildEnglishPath(states).map((node) => node.status))
      .toEqual(['mastered', 'current', 'upcoming']);
  });
});
