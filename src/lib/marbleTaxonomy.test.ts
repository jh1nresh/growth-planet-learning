import {describe, expect, it} from 'vitest';
import {marbleDependencies, marbleTopicById, getDirectPrerequisites, getDirectUnlocks, getPrerequisiteCount} from './marbleTaxonomy';

describe('Marble taxonomy relations', () => {
  const firstEdge = marbleDependencies[0];

  it('resolves both directions of a direct dependency', () => {
    expect(getDirectPrerequisites(firstEdge.topicId).some((item) => item.topic.id === firstEdge.prerequisiteId)).toBe(true);
    expect(getDirectUnlocks(firstEdge.prerequisiteId).some((item) => item.topic.id === firstEdge.topicId)).toBe(true);
  });

  it('returns no relations for an unknown topic', () => {
    expect(getDirectPrerequisites('mt_unknown')).toEqual([]);
    expect(getDirectUnlocks('mt_unknown')).toEqual([]);
    expect(getPrerequisiteCount('mt_unknown')).toBe(0);
  });

  it('counts unique transitive prerequisites', () => {
    const topicWithPrerequisites = [...marbleTopicById.keys()].find((topicId) => getDirectPrerequisites(topicId).length > 0);
    expect(topicWithPrerequisites).toBeDefined();
    const count = getPrerequisiteCount(topicWithPrerequisites!);
    expect(count).toBeGreaterThanOrEqual(getDirectPrerequisites(topicWithPrerequisites!).length);
    expect(count).toBeLessThan(marbleTopicById.size);
  });
});
