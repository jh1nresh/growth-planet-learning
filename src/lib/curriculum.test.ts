import {describe, expect, it} from 'vitest';
import {dependencies, getRegionStatus, missions, regions, topicById, topics} from './curriculum';

describe('curriculum graph', () => {
  it('keeps all dependency references valid', () => {
    for (const edge of dependencies) {
      expect(topicById.has(edge.topicId)).toBe(true);
      expect(topicById.has(edge.prerequisiteId)).toBe(true);
    }
  });

  it('uses original Growth Planet IDs', () => {
    expect(topics.every((topic) => /^tw_(math|eng)_g1_/.test(topic.id))).toBe(true);
  });

  it('unlocks Math regions sequentially while English Port stays available', () => {
    const completed = new Set<string>();
    const math = regions.filter((region) => region.subject === 'Mathematics').sort((a, b) => a.order - b.order);
    const english = regions.find((region) => region.id === 'english_first_dock');
    expect(getRegionStatus(math[0], completed)).toBe('available');
    expect(getRegionStatus(math[1], completed)).toBe('locked');
    expect(getRegionStatus(english!, completed)).toBe('available');

    completed.add(missions.find((mission) => mission.regionId === math[0].id)!.id);
    expect(getRegionStatus(math[1], completed)).toBe('available');
  });
});
