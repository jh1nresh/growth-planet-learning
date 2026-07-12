import type {Dependency, Topic} from '../../types';

const DOMAIN_ANGLE_JITTER = 0.48;
const MIN_RADIUS = 9;
const RADIUS_SPREAD = 16;
const CENTRALITY_RADIUS_WEIGHT = 3;
const AGE_AXIS_MIDPOINT = 8;
const AGE_AXIS_SCALE = 4;
const HEIGHT_JITTER = 1.8;

export interface MarbleGraphNode {
  topic: Topic;
  position: [number, number, number];
}

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0) / 4294967295;
}

export function buildMarbleGraphLayout(topics: Topic[], dependencies: Dependency[]) {
  const domains = [...new Set(topics.map((topic) => `${topic.subject}:${topic.domain}`))].sort();
  const domainIndex = new Map(domains.map((domain, index) => [domain, index]));
  const nodes = topics.map((topic) => {
    const domain = `${topic.subject}:${topic.domain}`;
    const baseAngle = ((domainIndex.get(domain) ?? 0) / domains.length) * Math.PI * 2;
    const angle = baseAngle + (hash(`${topic.id}:angle`) - 0.5) * DOMAIN_ANGLE_JITTER;
    const radius = MIN_RADIUS + hash(`${topic.id}:radius`) * RADIUS_SPREAD + topic.centrality * CENTRALITY_RADIUS_WEIGHT;
    const age = (topic.ageRangeStart + topic.ageRangeEnd) / 2;
    const y = (age - AGE_AXIS_MIDPOINT) * AGE_AXIS_SCALE + (hash(`${topic.id}:height`) - 0.5) * HEIGHT_JITTER;

    return {
      topic,
      position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [number, number, number],
    };
  });
  const nodeIds = new Set(nodes.map((node) => node.topic.id));

  return {
    nodes,
    edges: dependencies.filter((edge) => nodeIds.has(edge.topicId) && nodeIds.has(edge.prerequisiteId)),
  };
}
