import topicFile from '../data/topics.json';
import dependencyFile from '../data/dependencies.json';
import clusterFile from '../data/clusters.json';
import missionFile from '../data/missions.json';
import worldFile from '../data/world.json';
import type {Cluster, Dependency, Mission, Subject, Topic, WorldRegion} from '../types';

export const topics = topicFile.topics as Topic[];
export const dependencies = dependencyFile.dependencies as Dependency[];
export const clusters = clusterFile.clusters as Cluster[];
export const missions = missionFile.missions as Mission[];
export const regions = worldFile.regions as WorldRegion[];

export const topicById = new Map(topics.map((topic) => [topic.id, topic]));
export const clusterById = new Map(clusters.map((cluster) => [cluster.id, cluster]));
export const missionByRegionId = new Map(missions.map((mission) => [mission.regionId, mission]));
const regionById = new Map(regions.map((region) => [region.id, region]));
const regionIdByTopicId = new Map(missions.flatMap((mission) => mission.topicIds.map((topicId) => [topicId, mission.regionId] as const)));

export function getSubjectRegions(subject: Subject): WorldRegion[] {
  return regions.filter((region) => region.subject === subject).sort((a, b) => a.order - b.order);
}

export function getRegionStatus(region: WorldRegion, completedMissionIds: Set<string>) {
  if (region.comingSoon) return 'coming-soon' as const;
  const mission = missionByRegionId.get(region.id);
  if (!mission) return 'locked' as const;
  if (completedMissionIds.has(mission.id)) return 'complete' as const;
  if (region.subject === 'English') return 'available' as const;

  const mathRegions = getSubjectRegions('Mathematics').filter((item) => !item.comingSoon);
  const previous = mathRegions.find((item) => item.order === region.order - 1);
  if (!previous) return 'available' as const;
  const previousMission = missionByRegionId.get(previous.id);
  return previousMission && completedMissionIds.has(previousMission.id) ? 'available' as const : 'locked' as const;
}

export function getPrerequisites(topicId: string) {
  return dependencies.filter((edge) => edge.topicId === topicId).map((edge) => topicById.get(edge.prerequisiteId)).filter(Boolean) as Topic[];
}

export function getRegionDependencyEdges(subject: Subject) {
  const edgeByRegions = new Map<string, {sourceRegionId: string; targetRegionId: string; strength: Dependency['strength']}>();

  for (const dependency of dependencies) {
    const sourceRegionId = regionIdByTopicId.get(dependency.prerequisiteId);
    const targetRegionId = regionIdByTopicId.get(dependency.topicId);
    if (!sourceRegionId || !targetRegionId || sourceRegionId === targetRegionId) continue;
    if (regionById.get(sourceRegionId)?.subject !== subject || regionById.get(targetRegionId)?.subject !== subject) continue;

    const key = `${sourceRegionId}:${targetRegionId}`;
    const existing = edgeByRegions.get(key);
    if (!existing || dependency.strength === 'hard') {
      edgeByRegions.set(key, {sourceRegionId, targetRegionId, strength: dependency.strength});
    }
  }

  return [...edgeByRegions.values()].sort((left, right) => {
    const leftOrder = regionById.get(left.targetRegionId)?.order ?? 0;
    const rightOrder = regionById.get(right.targetRegionId)?.order ?? 0;
    const leftSourceOrder = regionById.get(left.sourceRegionId)?.order ?? 0;
    const rightSourceOrder = regionById.get(right.sourceRegionId)?.order ?? 0;
    return leftOrder - rightOrder || leftSourceOrder - rightSourceOrder;
  });
}
