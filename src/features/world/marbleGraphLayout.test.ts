import {describe, expect, it} from 'vitest';
import type {Dependency, Topic} from '../../types';
import {buildMarbleGraphLayout} from './marbleGraphLayout';

const topic = (id: string, age: number): Topic => ({
  id,
  type: 'CONCEPTUAL',
  subject: 'Mathematics',
  domain: 'Number',
  name: id,
  description: id,
  ageRangeStart: age,
  ageRangeEnd: age,
  centrality: 0.5,
  evidence: [],
  assessmentPrompt: '',
  standards: [],
});

describe('buildMarbleGraphLayout', () => {
  it('uses age as the vertical axis and keeps valid prerequisite edges', () => {
    const topics = [topic('younger', 5), topic('older', 10)];
    const dependencies: Dependency[] = [
      {topicId: 'older', prerequisiteId: 'younger', strength: 'hard', reason: 'comes first'},
      {topicId: 'missing', prerequisiteId: 'younger', strength: 'soft', reason: 'not visible'},
    ];
    const graph = buildMarbleGraphLayout(topics, dependencies);

    expect(graph.nodes.find((node) => node.topic.id === 'older')!.position[1])
      .toBeGreaterThan(graph.nodes.find((node) => node.topic.id === 'younger')!.position[1]);
    expect(graph.edges).toHaveLength(1);
  });

  it('is deterministic for the same taxonomy', () => {
    const topics = [topic('one', 6), topic('two', 7)];
    expect(buildMarbleGraphLayout(topics, []).nodes).toEqual(buildMarbleGraphLayout(topics, []).nodes);
  });

  it('supports an empty taxonomy', () => {
    expect(buildMarbleGraphLayout([], [])).toEqual({nodes: [], edges: []});
  });

  it('places a single topic and removes dependencies outside the visible set', () => {
    const onlyTopic = topic('only', 8);
    const graph = buildMarbleGraphLayout([onlyTopic], [
      {topicId: 'only', prerequisiteId: 'missing', strength: 'hard', reason: 'outside filter'},
    ]);
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].position.every(Number.isFinite)).toBe(true);
    expect(graph.edges).toEqual([]);
  });
});
