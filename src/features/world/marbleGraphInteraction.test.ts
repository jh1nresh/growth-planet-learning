import {describe, expect, it} from 'vitest';
import type {Dependency, Topic} from '../../types';
import type {MarbleGraphNode} from './marbleGraphLayout';
import {getConnectedTopicIds, getTopicAtIndex} from './marbleGraphInteraction';

const topic: Topic = {
  id: 'selected',
  type: 'CONCEPTUAL',
  subject: 'Mathematics',
  domain: 'Number',
  name: 'Selected',
  description: 'Selected topic',
  ageRangeStart: 6,
  ageRangeEnd: 7,
  centrality: 0.5,
  evidence: [],
  assessmentPrompt: '',
  standards: [],
};
const nodes: MarbleGraphNode[] = [{topic, position: [0, 0, 0]}];
const edges: Dependency[] = [
  {topicId: 'selected', prerequisiteId: 'before', strength: 'hard', reason: 'before'},
  {topicId: 'after', prerequisiteId: 'selected', strength: 'soft', reason: 'after'},
  {topicId: 'other', prerequisiteId: 'unrelated', strength: 'hard', reason: 'unrelated'},
];

describe('Marble graph interaction helpers', () => {
  it('returns the selected topic and its direct neighbors', () => {
    expect([...getConnectedTopicIds('selected', edges)].sort()).toEqual(['after', 'before', 'selected']);
  });

  it('returns an empty connected set without a selection', () => {
    expect(getConnectedTopicIds(null, edges).size).toBe(0);
  });

  it('resolves only valid point indices', () => {
    expect(getTopicAtIndex(nodes, 0)).toBe(topic);
    expect(getTopicAtIndex(nodes, undefined)).toBeNull();
    expect(getTopicAtIndex(nodes, 2)).toBeNull();
  });
});
