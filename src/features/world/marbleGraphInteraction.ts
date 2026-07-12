import type {Dependency, Topic} from '../../types';
import type {MarbleGraphNode} from './marbleGraphLayout';

export function getConnectedTopicIds(selectedTopicId: string | null, edges: Dependency[]) {
  const connected = new Set<string>();
  if (!selectedTopicId) return connected;

  connected.add(selectedTopicId);
  for (const edge of edges) {
    if (edge.topicId === selectedTopicId) connected.add(edge.prerequisiteId);
    if (edge.prerequisiteId === selectedTopicId) connected.add(edge.topicId);
  }
  return connected;
}

export function getTopicAtIndex(nodes: MarbleGraphNode[], index: number | undefined): Topic | null {
  if (index === undefined) return null;
  return nodes[index]?.topic ?? null;
}
