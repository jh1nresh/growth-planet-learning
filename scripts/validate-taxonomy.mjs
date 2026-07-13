import {readFile} from 'node:fs/promises';

const root = new URL('../src/data/', import.meta.url);
const readJson = async (name) => JSON.parse(await readFile(new URL(name, root), 'utf8'));

const [topicFile, dependencyFile, clusterFile, missionFile, worldFile] = await Promise.all([
  readJson('topics.json'),
  readJson('dependencies.json'),
  readJson('clusters.json'),
  readJson('missions.json'),
  readJson('world.json'),
]);
const [marbleTopicFile, marbleDependencyFile] = await Promise.all([
  readJson('marble-topics.json'),
  readJson('marble-dependencies.json'),
]);

const topics = topicFile.topics;
const dependencies = dependencyFile.dependencies;
const clusters = clusterFile.clusters;
const missions = missionFile.missions;
const regions = worldFile.regions;
const topicIds = new Set(topics.map((topic) => topic.id));
const missionIds = new Set(missions.map((mission) => mission.id));
const regionIds = new Set(regions.map((region) => region.id));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(topicFile.topicCount === topics.length, 'topicCount does not match topics length');
assert(dependencyFile.dependencyCount === dependencies.length, 'dependencyCount does not match dependencies length');
assert(clusterFile.clusterCount === clusters.length, 'clusterCount does not match clusters length');
assert(topicIds.size === topics.length, 'Topic IDs must be unique');
assert(missionIds.size === missions.length, 'Mission IDs must be unique');
assert(regionIds.size === regions.length, 'Region IDs must be unique');

for (const topic of topics) {
  assert(/^tw_(math|eng)_g1_/.test(topic.id), `Topic ${topic.id} must use a Growth Planet ID`);
  assert(Array.isArray(topic.evidence) && topic.evidence.length > 0, `Topic ${topic.id} needs evidence`);
  assert(Array.isArray(topic.standards) && topic.standards.length > 0, `Topic ${topic.id} needs standards`);
  assert(typeof topic.assessmentPrompt === 'string' && topic.assessmentPrompt.length > 0, `Topic ${topic.id} needs an assessment prompt`);
}

const outgoing = new Map(topics.map((topic) => [topic.id, []]));
for (const edge of dependencies) {
  assert(topicIds.has(edge.topicId), `Unknown dependency topic ${edge.topicId}`);
  assert(topicIds.has(edge.prerequisiteId), `Unknown prerequisite ${edge.prerequisiteId}`);
  assert(edge.topicId !== edge.prerequisiteId, `Self dependency on ${edge.topicId}`);
  outgoing.get(edge.prerequisiteId).push(edge.topicId);
}

const visiting = new Set();
const visited = new Set();
function visit(topicId) {
  if (visiting.has(topicId)) throw new Error(`Dependency cycle detected at ${topicId}`);
  if (visited.has(topicId)) return;
  visiting.add(topicId);
  for (const next of outgoing.get(topicId)) visit(next);
  visiting.delete(topicId);
  visited.add(topicId);
}
for (const topicId of topicIds) visit(topicId);

for (const cluster of clusters) {
  assert(cluster.topicIds.length > 0, `Cluster ${cluster.id} has no topics`);
  for (const topicId of cluster.topicIds) assert(topicIds.has(topicId), `Cluster ${cluster.id} references ${topicId}`);
}

for (const mission of missions) {
  assert(regionIds.has(mission.regionId), `Mission ${mission.id} references unknown region ${mission.regionId}`);
  assert(mission.questions.length > 0, `Mission ${mission.id} has no questions`);
  for (const topicId of mission.topicIds) assert(topicIds.has(topicId), `Mission ${mission.id} references ${topicId}`);
  for (const question of mission.questions) {
    assert(question.options.includes(question.correctOption), `Question ${question.id} has an invalid answer`);
    assert(typeof question.hint === 'string' && question.hint.length > 0, `Question ${question.id} needs a non-answer hint`);
  }
}

for (const region of regions.filter((region) => !region.comingSoon)) {
  assert(missions.some((mission) => mission.regionId === region.id), `Playable region ${region.id} needs a mission`);
}

console.log(`Taxonomy valid: ${topics.length} topics, ${dependencies.length} dependencies, ${clusters.length} clusters, ${missions.length} missions, DAG confirmed.`);

const marbleTopics = marbleTopicFile.topics;
const marbleDependencies = marbleDependencyFile.dependencies;
const marbleTopicIds = new Set(marbleTopics.map((topic) => topic.id));
assert(marbleTopicFile.topicCount === marbleTopics.length, 'Marble topicCount does not match topics length');
assert(marbleDependencyFile.edgeCount === marbleDependencies.length, 'Marble edgeCount does not match dependencies length');
assert(marbleTopicIds.size === marbleTopics.length, 'Marble topic IDs must be unique');

for (const topic of marbleTopics) {
  assert(/^mt_/.test(topic.id), `Marble topic ${topic.id} must keep its source ID`);
  assert(['Mathematics', 'English'].includes(topic.subject), `Unexpected Marble subject ${topic.subject}`);
  assert(topic.ageRangeEnd <= 12, `Marble topic ${topic.id} is outside the under-12 filter`);
}

const marbleOutgoing = new Map(marbleTopics.map((topic) => [topic.id, []]));
for (const edge of marbleDependencies) {
  assert(marbleTopicIds.has(edge.topicId), `Unknown Marble dependency topic ${edge.topicId}`);
  assert(marbleTopicIds.has(edge.prerequisiteId), `Unknown Marble prerequisite ${edge.prerequisiteId}`);
  assert(edge.topicId !== edge.prerequisiteId, `Marble self dependency on ${edge.topicId}`);
  marbleOutgoing.get(edge.prerequisiteId).push(edge.topicId);
}

const marbleVisiting = new Set();
const marbleVisited = new Set();
function visitMarble(topicId) {
  if (marbleVisiting.has(topicId)) throw new Error(`Marble dependency cycle detected at ${topicId}`);
  if (marbleVisited.has(topicId)) return;
  marbleVisiting.add(topicId);
  for (const next of marbleOutgoing.get(topicId)) visitMarble(next);
  marbleVisiting.delete(topicId);
  marbleVisited.add(topicId);
}
for (const topicId of marbleTopicIds) visitMarble(topicId);

console.log(`Marble subset valid: ${marbleTopics.length} topics, ${marbleDependencies.length} dependencies, Mathematics + English through age 12, DAG confirmed.`);
