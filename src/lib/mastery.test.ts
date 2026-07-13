import {describe, expect, it} from 'vitest';
import {emptyTopicStates, getRecommendation, getRecommendationForTopic, recordLearningEvidence} from './mastery';
import {dependencies, topics} from './curriculum';

describe('mastery engine', () => {
  it('initializes one learner state for every taxonomy topic', () => {
    const states = emptyTopicStates(topics);
    expect(states).toHaveLength(18);
    expect(new Set(states.map((state) => state.topicId)).size).toBe(18);
  });

  it('weights correct independent evidence above hinted retries', () => {
    const initial = emptyTopicStates(topics);
    const independent = recordLearningEvidence(initial, {
      topicId: 'tw_math_g1_count_20',
      correct: true,
      hintCount: 0,
      retryCount: 0,
      occurredAt: '2026-07-13T00:00:00.000Z',
    });
    const assisted = recordLearningEvidence(initial, {
      topicId: 'tw_math_g1_count_20',
      correct: true,
      hintCount: 1,
      retryCount: 1,
      occurredAt: '2026-07-13T00:00:00.000Z',
    });

    expect(independent[0].mastery).toBeGreaterThan(assisted[0].mastery);
    expect(independent[0].attempts).toBe(1);
    expect(assisted[0].hintCount).toBe(1);
    expect(assisted[0].retryCount).toBe(1);
  });

  it('recommends the nearest unmet hard prerequisite', () => {
    let states = emptyTopicStates(topics);
    states = recordLearningEvidence(states, {
      topicId: 'tw_math_g1_count_20', correct: true, hintCount: 0, retryCount: 0, occurredAt: '2026-07-13T00:00:00.000Z',
    });
    states = recordLearningEvidence(states, {
      topicId: 'tw_math_g1_count_20', correct: true, hintCount: 0, retryCount: 0, occurredAt: '2026-07-13T00:01:00.000Z',
    });

    const recommendation = getRecommendationForTopic('tw_math_g1_tens_ones', states, topics, dependencies);
    expect(recommendation.topic.id).toBe('tw_math_g1_bundle_ten');
    expect(recommendation.reason).toContain('十位與個位');
  });

  it('only recommends a topic after hard prerequisites reach mastery', () => {
    const initial = getRecommendation('Mathematics', emptyTopicStates(topics), topics, dependencies);
    expect(initial.topic.id).toBe('tw_math_g1_count_20');

    let states = emptyTopicStates(topics);
    for (let index = 0; index < 2; index += 1) {
      states = recordLearningEvidence(states, {
        topicId: 'tw_math_g1_count_20', correct: true, hintCount: 0, retryCount: 0, occurredAt: `2026-07-13T00:0${index}:00.000Z`,
      });
    }
    const next = getRecommendation('Mathematics', states, topics, dependencies);
    expect(next.topic.id).toBe('tw_math_g1_count_100');
  });

  it('explains review mode after every subject topic is mastered', () => {
    const mastered = emptyTopicStates(topics).map((state) => ({
      ...state,
      mastery: topics.find((topic) => topic.id === state.topicId)?.subject === 'Mathematics' ? 1 : 0,
      attempts: 1,
    }));
    const recommendation = getRecommendation('Mathematics', mastered, topics, dependencies);
    expect(recommendation.reason).toContain('都已掌握');
  });
});
