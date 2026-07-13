import {describe, expect, it} from 'vitest';
import {emptyTopicStates} from './mastery';
import {topics} from './curriculum';
import {curriculumFrameworkBySlug, curriculumStandardByKey, getCurriculumGraph, getCurriculumRecommendation} from './curriculumStandards';

describe('Taiwan and China curriculum overlays', () => {
  it.each(['tw-108-math', 'cn-2022-math'])('builds a complete grade-one math DAG for %s', (slug) => {
    const graph = getCurriculumGraph(slug, 1);
    const topicIds = new Set(graph.topics.map((topic) => topic.id));
    expect(graph.topics).toHaveLength(15);
    expect(graph.dependencies.every((edge) => topicIds.has(edge.topicId) && topicIds.has(edge.prerequisiteId))).toBe(true);
    expect(graph.topics.findIndex((topic) => topic.id === 'tw_math_g1_bundle_ten'))
      .toBeLessThan(graph.topics.findIndex((topic) => topic.id === 'tw_math_g1_tens_ones'));
  });

  it('preserves official Taiwan codes and labels China locators as internal', () => {
    expect(curriculumStandardByKey.get('tw-108-math:N-1-1')?.data.codeOrigin).toBe('official');
    expect(curriculumStandardByKey.get('cn-2022-math:stage1.NU.1')?.data.codeOrigin).toBe('internal-locator');
    expect(curriculumStandardByKey.get('cn-2022-math:stage1.NU.1')?.data.alignmentStatus).toBe('provisional');
  });

  it('uses the same learner engine after selecting a jurisdiction overlay', () => {
    const states = emptyTopicStates(topics);
    expect(getCurriculumRecommendation('tw-108-math', 1, states).topic.id).toBe('tw_math_g1_count_20');
    expect(getCurriculumRecommendation('cn-2022-math', 1, states).topic.id).toBe('tw_math_g1_count_20');
  });

  it('does not expose the broader standards band as an implemented grade', () => {
    expect(getCurriculumGraph('tw-108-math', 2).topics).toHaveLength(0);
    expect(getCurriculumGraph('cn-2022-math', 2).topics).toHaveLength(0);
    expect(curriculumFrameworkBySlug.get('cn-2022-math')?.topics[0].data.grades).toEqual([1, 2]);
    expect(curriculumFrameworkBySlug.get('cn-2022-math')?.version).toBe('2022 年版');
  });
});
