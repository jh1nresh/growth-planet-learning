import {describe, expect, it} from 'vitest';
import {topics} from '../../lib/curriculum';
import {emptyTopicStates} from '../../lib/mastery';
import {getEnglishStudioForScenario, getLearningStudio, learningStudios} from '../learning/learningStudios';
import {ENGLISH_COURSE_TOPIC_IDS, englishCourseScenarios} from './englishCourse';
import {buildEnglishPath, buildSubjectPath} from './englishPath';

describe('English path', () => {
  it('maps the twelve-skill dependency DAG into a readable path', () => {
    const path = buildEnglishPath(emptyTopicStates(topics));

    expect(path.map((node) => node.topic.id)).toEqual(ENGLISH_COURSE_TOPIC_IDS);
    expect(path.map((node) => node.status)).toEqual(['current', ...Array(11).fill('upcoming')]);
    expect(path[1].incoming?.prerequisiteId).toBe('tw_eng_g1_letter_sounds');
    expect(path.find((node) => node.topic.id === 'tw_eng_g1_sight_words')?.hardLocked).toBe(false);
    expect(path.find((node) => node.topic.id === 'tw_eng_g1_nouns_verbs')?.hardLocked).toBe(true);
    expect(path[2].incoming?.strength).toBe('soft');
    expect(path.find((node) => node.topic.id === 'tw_eng_g1_describe')?.prerequisites).toHaveLength(3);
    expect(path.at(-1)?.incoming?.prerequisiteId).toBe('tw_eng_g1_describe');
  });

  it('moves the current marker after mastery', () => {
    const states = emptyTopicStates(topics).map((state) => state.topicId === 'tw_eng_g1_letter_sounds'
      ? {...state, mastery: 0.72, attempts: 1, correctAttempts: 1}
      : state);

    expect(buildEnglishPath(states).map((node) => node.status))
      .toEqual(['mastered', 'current', ...Array(10).fill('upcoming')]);
  });

  it('opens the speaking lesson only after CAT reaches the mastery threshold', () => {
    const almostMastered = emptyTopicStates(topics).map((state) => state.topicId === 'tw_eng_g1_letter_sounds'
      ? {...state, mastery: 0.699}
      : state);
    const mastered = almostMastered.map((state) => state.topicId === 'tw_eng_g1_letter_sounds'
      ? {...state, mastery: 0.7}
      : state);

    expect(getLearningStudio('English', almostMastered).lessonTopicId).toBe(learningStudios.English.lessonTopicId);
    expect(getLearningStudio('English', mastered).lessonTopicId).toBe('tw_eng_g1_sight_words');
  });

  it('reads Today progress from a recommended secondary evidence topic', () => {
    const states = emptyTopicStates(topics).map((state) => {
      if (state.topicId === 'tw_eng_g1_letter_sounds' || state.topicId === 'tw_eng_g1_sight_words') {
        return {...state, mastery: 0.72, attempts: 1, correctAttempts: 1};
      }
      return state;
    });

    const studio = getLearningStudio('English', states);

    expect(studio.lessonTopicId).toBe('tw_eng_g1_greetings');
    expect(studio.lessonEvidenceTopicIds).toEqual(['tw_eng_g1_sight_words', 'tw_eng_g1_greetings']);
    expect(studio.lessonName).toBe('My name is Mia');
  });

  it('unlocks eligible branches without making each one the recommendation', () => {
    const masteredIds = new Set([
      'tw_eng_g1_letter_sounds',
      'tw_eng_g1_sight_words',
      'tw_eng_g1_greetings',
      'tw_eng_g1_nouns_verbs',
    ]);
    const states = emptyTopicStates(topics).map((state) => masteredIds.has(state.topicId)
      ? {...state, mastery: 0.72, attempts: 1, correctAttempts: 1}
      : state);
    const path = buildEnglishPath(states);

    expect(path.find((node) => node.status === 'current')?.topic.id).toBe('tw_eng_g1_build_sentences');
    expect(path.find((node) => node.topic.id === 'tw_eng_g1_pronouns')?.hardLocked).toBe(false);
    expect(path.find((node) => node.topic.id === 'tw_eng_g1_determiners')?.hardLocked).toBe(false);
    expect(path.find((node) => node.topic.id === 'tw_eng_g1_question_words')?.hardLocked).toBe(false);
    expect(path.find((node) => node.topic.id === 'tw_eng_g1_ask_questions')?.hardLocked).toBe(true);
  });

  it.each([
    ['Mathematics', ['tw_math_g1_count_20', 'tw_math_g1_bundle_ten', 'tw_math_g1_tens_ones']],
    ['Chinese', ['tw_zh_g1_zhuyin_symbols', 'tw_zh_g1_zhuyin_blending', 'tw_zh_g1_zhuyin_word_link']],
  ] as const)('builds the focused %s path from curriculum data', (subject, expectedIds) => {
    const path = buildSubjectPath(subject, emptyTopicStates(topics));
    expect(path.map((node) => node.topic.id)).toEqual(expectedIds);
    expect(path.map((node) => node.status)).toEqual(['current', 'upcoming', 'upcoming']);
    expect(path[1].incoming?.prerequisiteId).toBe(expectedIds[0]);
  });

  it('maps each implemented lesson to only the topics whose evidence it records', () => {
    expect(learningStudios.English.lessonEvidenceTopicIds).toEqual(['tw_eng_g1_letter_sounds']);
    expect(getEnglishStudioForScenario(englishCourseScenarios[1]).lessonEvidenceTopicIds).toEqual(['tw_eng_g1_sight_words', 'tw_eng_g1_greetings']);
    expect(learningStudios.Mathematics.lessonEvidenceTopicIds).toEqual(learningStudios.Mathematics.topicIds);
    expect(learningStudios.Chinese.lessonEvidenceTopicIds).toEqual(['tw_zh_g1_zhuyin_symbols']);
    expect(englishCourseScenarios.flatMap((scenario) => scenario.evidenceTopicIds))
      .toEqual(expect.arrayContaining(ENGLISH_COURSE_TOPIC_IDS));
  });
});
