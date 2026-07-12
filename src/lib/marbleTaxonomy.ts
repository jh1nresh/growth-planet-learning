import dependencyFile from '../data/marble-dependencies.json';
import topicFile from '../data/marble-topics.json';
import type {Dependency, Topic} from '../types';

export const marbleTopics = topicFile.topics as Topic[];
export const marbleDependencies = dependencyFile.dependencies as Dependency[];
export const marbleTopicById = new Map(marbleTopics.map((topic) => [topic.id, topic]));

export function getDirectPrerequisites(topicId: string) {
  return marbleDependencies
    .filter((edge) => edge.topicId === topicId)
    .map((edge) => ({edge, topic: marbleTopicById.get(edge.prerequisiteId)}))
    .filter((item): item is {edge: Dependency; topic: Topic} => Boolean(item.topic));
}

export function getDirectUnlocks(topicId: string) {
  return marbleDependencies
    .filter((edge) => edge.prerequisiteId === topicId)
    .map((edge) => ({edge, topic: marbleTopicById.get(edge.topicId)}))
    .filter((item): item is {edge: Dependency; topic: Topic} => Boolean(item.topic));
}

export function getPrerequisiteCount(topicId: string) {
  const visited = new Set<string>();
  const stack = getDirectPrerequisites(topicId).map((item) => item.topic.id);

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    stack.push(...getDirectPrerequisites(current).map((item) => item.topic.id));
  }

  return visited.size;
}
