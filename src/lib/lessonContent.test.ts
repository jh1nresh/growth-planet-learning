import {describe, expect, it} from 'vitest';
import {missions, regions, topics} from './curriculum';
import {
  getLessonContentProfile,
  getMissionContent,
  getPlaceValueLessonContent,
  getRegionContent,
  getTopicContent,
  lessonContentProfiles,
  localizeRecommendationReason,
} from './lessonContent';

const mathTopics = topics.filter((topic) => topic.subject === 'Mathematics');
const mathMissions = missions.filter((mission) => mission.topicIds.some((topicId) => topicId.startsWith('tw_math_')));

describe('lesson content overlays', () => {
  it('keeps the same canonical topic IDs for Taiwan and China', () => {
    for (const topic of mathTopics) {
      expect(getTopicContent('tw-108-math', topic).id).toBe(topic.id);
      expect(getTopicContent('cn-2022-math', topic).id).toBe(topic.id);
    }
  });

  it('has reviewed China content for every current Grade 1 math topic', () => {
    const china = getLessonContentProfile('cn-2022-math');
    expect(china.topicOverrides).toHaveLength(15);
    expect(new Set(china.topicOverrides.map((override) => override.topicId))).toEqual(new Set(mathTopics.map((topic) => topic.id)));
    expect(china.topicOverrides.every((override) => ['verified', 'provisional', 'supplemental'].includes(override.placement.status))).toBe(true);
    expect(china.topicOverrides.every((override) => override.placement.sourceLocator.length > 0)).toBe(true);
  });

  it('localizes every math mission without changing scoring IDs', () => {
    const china = getLessonContentProfile('cn-2022-math');
    expect(china.missionOverrides).toHaveLength(mathMissions.length);
    for (const mission of mathMissions) {
      const localized = getMissionContent('cn-2022-math', mission);
      expect(localized.id).toBe(mission.id);
      expect(localized.topicIds).toEqual(mission.topicIds);
      expect(localized.questions.map((question) => question.id)).toEqual(mission.questions.map((question) => question.id));
      expect(localized.questions.every((question) => question.options.includes(question.correctOption))).toBe(true);
    }
  });

  it('uses Taiwan dollars and renminbi only in their matching profile', () => {
    const coinTopic = topics.find((topic) => topic.id === 'tw_math_g1_coin_values')!;
    const measureMission = missions.find((mission) => mission.id === 'mission_measure_market')!;
    expect(getTopicContent('tw-108-math', coinTopic).description).toContain('新台幣');
    expect(getTopicContent('cn-2022-math', coinTopic).name).toBe('认识人民币');
    expect(JSON.stringify(getMissionContent('cn-2022-math', measureMission))).toContain('人民币');
    expect(JSON.stringify(getMissionContent('cn-2022-math', measureMission))).not.toContain('新台币');
    const measureRegion = getRegionContent('cn-2022-math', regions.find((region) => region.id === 'measure_market')!);
    expect(measureRegion.contentSummary).toContain('人民币');
    expect(measureRegion.contentSummary).not.toContain('新台币');
  });

  it('localizes the interactive place-value lesson and recommendation copy', () => {
    expect(getPlaceValueLessonContent('tw-108-math').bundleLabel).toBe('綁成一個十');
    expect(getPlaceValueLessonContent('cn-2022-math').bundleLabel).toBe('捆成1个十');
    expect(localizeRecommendationReason('cn-2022-math', '你已經會「數到 20」，接著學「十的好朋友」。'))
      .toBe('你已经会「數到 20」，接着学「十的好朋友」。');
    expect(localizeRecommendationReason('cn-2022-math', '先從「認識11～20」開始，讓芽芽看看你已經會什麼。'))
      .toBe('先从「認識11～20」开始，让芽芽看看你已经会什么。');
  });

  it('leaves English mission content unchanged', () => {
    const english = missions.find((mission) => mission.id === 'mission_english_first_dock')!;
    expect(getMissionContent('cn-2022-math', english)).toBe(english);
    expect(lessonContentProfiles).toHaveLength(2);
  });
});
