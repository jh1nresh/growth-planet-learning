import {describe, expect, it} from 'vitest';
import {clusters, dependencies, regions, topics} from '../../lib/curriculum';
import {buildConstellationLayout} from './constellationLayout';

const regionIdByClusterId = new Map(regions.filter((region) => region.clusterId).map((region) => [region.clusterId, region.id] as const));
const regionIdByTopicId = new Map(clusters.flatMap((cluster) => cluster.topicIds.map((topicId) => [topicId, regionIdByClusterId.get(cluster.id)!] as const)));

describe('skill constellation layout', () => {
  it('builds separate Math and English subject graphs', () => {
    const math = buildConstellationLayout('Mathematics', topics, dependencies, regionIdByTopicId);
    const english = buildConstellationLayout('English', topics, dependencies, regionIdByTopicId);

    expect(math.nodes).toHaveLength(15);
    expect(english.nodes).toHaveLength(3);
    expect(math.nodes.every((node) => node.topic.subject === 'Mathematics')).toBe(true);
    expect(english.nodes.every((node) => node.topic.subject === 'English')).toBe(true);
  });

  it('draws prerequisites toward later unlocks inside the view box', () => {
    const graph = buildConstellationLayout('Mathematics', topics, dependencies, regionIdByTopicId);
    const nodeById = new Map(graph.nodes.map((node) => [node.topic.id, node]));

    for (const edge of graph.edges) {
      const source = nodeById.get(edge.prerequisiteId)!;
      const target = nodeById.get(edge.topicId)!;
      expect(source.depth).toBeLessThan(target.depth);
    }
    expect(graph.nodes.every((node) => node.x >= 80 && node.x <= 920 && node.y >= 120 && node.y <= 380)).toBe(true);
  });

  it('maps every visible topic to a mission region', () => {
    const graph = buildConstellationLayout('English', topics, dependencies, regionIdByTopicId);
    expect(graph.nodes.map((node) => node.regionId)).toEqual(['english_first_dock', 'english_first_dock', 'english_first_dock']);
  });
});
