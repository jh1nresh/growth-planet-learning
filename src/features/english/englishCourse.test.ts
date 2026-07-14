import {describe, expect, it} from 'vitest';
import {topics} from '../../lib/curriculum';
import {emptyTopicStates} from '../../lib/mastery';
import {marbleTopicById} from '../../lib/marbleTaxonomy';
import {
  ENGLISH_COURSE_TOPIC_IDS,
  englishCourseScenarios,
  englishTopicOverlays,
  getEnglishCourseSelection,
  getEnglishScenarioForTopic,
} from './englishCourse';

describe('English course overlay', () => {
  it('maps twelve local English skills to unique Marble source topics', () => {
    const localTopicById = new Map(topics.map((topic) => [topic.id, topic]));
    const expectedSources = {
      tw_eng_g1_letter_sounds: ['mt_F978c32kDr', 'Single Letter Sounds'],
      tw_eng_g1_sight_words: ['mt_YKkCM63fSC', 'Reading High-Frequency Words by Sight'],
      tw_eng_g1_greetings: ['mt_mB7DVai-Uf', 'Listening and responding'],
      tw_eng_g1_nouns_verbs: ['mt_yBJyCfhtem', 'Basic Nouns & Verbs'],
      tw_eng_g1_build_sentences: ['mt_N8CpN1EJrP', 'Building sentences'],
      tw_eng_g1_pronouns: ['mt_sZXPK1FnRB', 'Pronouns'],
      tw_eng_g1_determiners: ['mt_RioBUxHz1X', 'Determiners and articles'],
      tw_eng_g1_question_words: ['mt_6lHBTwQPrS', 'Question Words'],
      tw_eng_g1_ask_questions: ['mt_f8n4txtLej', 'Asking Questions'],
      tw_eng_g1_prepositions: ['mt_VY3rBq8RyP', 'Prepositions'],
      tw_eng_g1_describe: ['mt_4A7FYmvVhA', 'Describing Aloud'],
      tw_eng_g1_express_opinion: ['mt_S0hzjAeLSK', 'Expressing & Justifying Opinions'],
    } as const;

    expect(englishTopicOverlays).toHaveLength(12);
    expect(ENGLISH_COURSE_TOPIC_IDS).toHaveLength(12);
    expect(new Set(englishTopicOverlays.map((overlay) => overlay.topicId)).size).toBe(12);
    expect(new Set(englishTopicOverlays.map((overlay) => overlay.marbleTopicId)).size).toBe(12);

    for (const overlay of englishTopicOverlays) {
      expect([overlay.marbleTopicId, overlay.marbleTopicName]).toEqual(expectedSources[overlay.topicId as keyof typeof expectedSources]);
      expect(localTopicById.get(overlay.topicId)?.subject).toBe('English');
      expect(marbleTopicById.get(overlay.marbleTopicId)).toMatchObject({subject: 'English', name: overlay.marbleTopicName});
    }
  });

  it('provides ten playable situations that cover every active English skill', () => {
    const coveredTopicIds = new Set(englishCourseScenarios.flatMap((scenario) => scenario.evidenceTopicIds));

    expect(englishCourseScenarios).toHaveLength(10);
    expect(new Set(englishCourseScenarios.map((scenario) => scenario.id)).size).toBe(10);
    expect(new Set(englishCourseScenarios.map((scenario) => scenario.primaryTopicId)).size).toBe(10);
    expect(ENGLISH_COURSE_TOPIC_IDS.every((topicId) => coveredTopicIds.has(topicId))).toBe(true);

    for (const scenario of englishCourseScenarios) {
      expect(scenario.evidenceTopicIds).toContain(scenario.primaryTopicId);
      expect(getEnglishScenarioForTopic(scenario.primaryTopicId)).toBe(scenario);
      expect([...scenario.tileChoices].sort()).toEqual([...scenario.tokens, ...scenario.distractors].sort());
      expect(scenario.tileChoices.slice(0, scenario.tokens.length)).not.toEqual(scenario.tokens);
      if (scenario.kind === 'card' || scenario.kind === 'room') expect(scenario.intentChoices[0]).not.toBe(scenario.correctIntent);
    }

    expect(getEnglishScenarioForTopic('tw_eng_g1_prepositions')?.kind).toBe('room');
  });

  it('uses one prerequisite-aware selection for the next playable situation', () => {
    let states = emptyTopicStates(topics);
    expect(getEnglishCourseSelection(states).scenario.id).toBe('english_life_01_cat');

    for (const scenario of englishCourseScenarios.slice(0, -1)) {
      states = states.map((state) => scenario.evidenceTopicIds.includes(state.topicId)
        ? {...state, mastery: 0.72, attempts: 1, correctAttempts: 1}
        : state);
      expect(getEnglishCourseSelection(states).scenario.id)
        .toBe(englishCourseScenarios[englishCourseScenarios.indexOf(scenario) + 1].id);
    }
  });

  it('keeps a later situation locked until its hard prerequisite is mastered', () => {
    const states = emptyTopicStates(topics).map((state) => {
      if (!ENGLISH_COURSE_TOPIC_IDS.includes(state.topicId)) return state;
      if (state.topicId === 'tw_eng_g1_describe' || state.topicId === 'tw_eng_g1_express_opinion') return state;
      return {...state, mastery: 0.72, attempts: 1, correctAttempts: 1};
    });

    expect(getEnglishCourseSelection(states).topic.id).toBe('tw_eng_g1_describe');
    expect(getEnglishCourseSelection(states).scenario.id).toBe('english_life_09_red_bag');
  });

  it('replays the final situation after all twelve skills are mastered', () => {
    const mastered = emptyTopicStates(topics).map((state) => ENGLISH_COURSE_TOPIC_IDS.includes(state.topicId)
      ? {...state, mastery: 0.72, attempts: 1, correctAttempts: 1}
      : state);

    expect(getEnglishCourseSelection(mastered).scenario.id).toBe('english_life_10_cats');
    expect(getEnglishCourseSelection(mastered).reason).toContain('都已掌握');
  });
});
