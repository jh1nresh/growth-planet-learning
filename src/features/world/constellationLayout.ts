import type {Dependency, Subject, Topic} from '../../types';

export interface ConstellationNode {
  topic: Topic;
  regionId: string;
  depth: number;
  x: number;
  y: number;
}

export function buildConstellationLayout(
  subject: Subject,
  allTopics: Topic[],
  allDependencies: Dependency[],
  regionIdByTopicId: Map<string, string>,
) {
  const subjectTopics = allTopics.filter((topic) => topic.subject === subject && regionIdByTopicId.has(topic.id));
  const topicIds = new Set(subjectTopics.map((topic) => topic.id));
  const edges = allDependencies.filter((edge) => topicIds.has(edge.topicId) && topicIds.has(edge.prerequisiteId));
  const prerequisitesByTopicId = new Map<string, string[]>();
  for (const edge of edges) {
    prerequisitesByTopicId.set(edge.topicId, [...(prerequisitesByTopicId.get(edge.topicId) ?? []), edge.prerequisiteId]);
  }

  const depthByTopicId = new Map<string, number>();
  const getDepth = (topicId: string): number => {
    const cached = depthByTopicId.get(topicId);
    if (cached !== undefined) return cached;
    const prerequisites = prerequisitesByTopicId.get(topicId) ?? [];
    const depth = prerequisites.length === 0 ? 0 : Math.max(...prerequisites.map(getDepth)) + 1;
    depthByTopicId.set(topicId, depth);
    return depth;
  };
  for (const topic of subjectTopics) getDepth(topic.id);

  const maxDepth = Math.max(1, ...depthByTopicId.values());
  const nodesByDepth = new Map<number, Topic[]>();
  for (const topic of subjectTopics) {
    const depth = depthByTopicId.get(topic.id) ?? 0;
    nodesByDepth.set(depth, [...(nodesByDepth.get(depth) ?? []), topic]);
  }

  const nodes: ConstellationNode[] = [];
  for (const [depth, depthTopics] of nodesByDepth) {
    depthTopics.sort((left, right) => right.centrality - left.centrality || left.name.localeCompare(right.name));
    depthTopics.forEach((topic, index) => {
      nodes.push({
        topic,
        regionId: regionIdByTopicId.get(topic.id)!,
        depth,
        x: 80 + (depth / maxDepth) * 840,
        y: 120 + ((index + 1) / (depthTopics.length + 1)) * 260,
      });
    });
  }

  return {nodes, edges};
}
