import {readFile} from 'node:fs/promises';

const root = new URL('../src/data/', import.meta.url);
const readJson = async (name) => JSON.parse(await readFile(new URL(name, root), 'utf8'));

const [topicFile, dependencyFile, clusterFile, missionFile, worldFile, curriculumStandardFile, chineseStandardFile, lessonContentFile, englishCourseFile] = await Promise.all([
  readJson('topics.json'),
  readJson('dependencies.json'),
  readJson('clusters.json'),
  readJson('missions.json'),
  readJson('world.json'),
  readJson('curriculum-standards.json'),
  readJson('chinese-curriculum-standards.json'),
  readJson('lesson-content-overlays.json'),
  readJson('english-course-overlays.json'),
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
const curricula = curriculumStandardFile.curricula;
const standardKeys = new Set(curricula.flatMap((curriculum) => curriculum.topics.map((standard) => standard.key)));
const contentProfiles = lessonContentFile.profiles;
const chineseStandardKeys = new Set(chineseStandardFile.standards.map((standard) => standard.key));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(topicFile.topicCount === topics.length, 'topicCount does not match topics length');
assert(dependencyFile.dependencyCount === dependencies.length, 'dependencyCount does not match dependencies length');
assert(clusterFile.clusterCount === clusters.length, 'clusterCount does not match clusters length');
assert(topicIds.size === topics.length, 'Topic IDs must be unique');
assert(missionIds.size === missions.length, 'Mission IDs must be unique');
assert(regionIds.size === regions.length, 'Region IDs must be unique');
assert(curriculumStandardFile.curriculumCount === curricula.length, 'curriculumCount does not match curricula length');
assert(standardKeys.size === curricula.reduce((count, curriculum) => count + curriculum.topics.length, 0), 'Curriculum standard keys must be unique');
assert(contentProfiles.length === 2, 'Lesson content needs Taiwan and China profiles');
assert(chineseStandardFile.standardCount === chineseStandardFile.standards.length, 'Chinese curriculum standardCount mismatch');
assert(chineseStandardKeys.size === chineseStandardFile.standards.length, 'Chinese curriculum standard keys must be unique');
assert(chineseStandardFile.alignmentStatus === 'provisional', 'Chinese curriculum alignment must remain provisional until classroom review');
assert(new Set(contentProfiles.map((profile) => profile.frameworkSlug)).size === contentProfiles.length, 'Lesson content profile slugs must be unique');

for (const curriculum of curricula) {
  assert(curriculum.topicCount === curriculum.topics.length, `Curriculum ${curriculum.slug} topicCount mismatch`);
  assert(curriculum.textIncluded === false, `Curriculum ${curriculum.slug} must remain codes-only until upstream text rights are reviewed`);
  assert(Array.isArray(curriculum.implementedGrades) && curriculum.implementedGrades.length > 0, `Curriculum ${curriculum.slug} needs implemented grades`);
  for (const standard of curriculum.topics) {
    assert(standard.key.startsWith(`${curriculum.slug}:`), `Standard ${standard.key} must use the curriculum slug`);
    assert(Array.isArray(standard.data.grades) && standard.data.grades.length > 0, `Standard ${standard.key} needs grades`);
    assert(['verified', 'provisional'].includes(standard.data.alignmentStatus), `Standard ${standard.key} needs alignment status`);
  }
}

for (const topic of topics) {
  assert(/^tw_(math|eng|zh)_g1_/.test(topic.id), `Topic ${topic.id} must use a local curriculum ID`);
  assert(Array.isArray(topic.evidence) && topic.evidence.length > 0, `Topic ${topic.id} needs evidence`);
  assert(Array.isArray(topic.standards) && topic.standards.length > 0, `Topic ${topic.id} needs standards`);
  assert(typeof topic.assessmentPrompt === 'string' && topic.assessmentPrompt.length > 0, `Topic ${topic.id} needs an assessment prompt`);
  if (topic.subject === 'Mathematics') {
    assert(topic.standards.every((key) => standardKeys.has(key)), `Math topic ${topic.id} references an unknown curriculum standard`);
    assert(topic.standards.some((key) => key.startsWith('tw-108-math:')), `Math topic ${topic.id} needs a Taiwan alignment`);
    assert(topic.standards.some((key) => key.startsWith('cn-2022-math:')), `Math topic ${topic.id} needs a China alignment`);
  }
  if (topic.subject === 'Chinese') {
    assert(topic.standards.every((key) => chineseStandardKeys.has(key)), `Chinese topic ${topic.id} references an unknown curriculum locator`);
    assert(topic.standards.every((key) => key.startsWith('tw-108-guoyu:')), `Chinese topic ${topic.id} needs a Taiwan Chinese Language Arts alignment`);
  }
}

const chineseTopics = topics.filter((topic) => topic.subject === 'Chinese');
const chineseTopicIds = new Set(chineseTopics.map((topic) => topic.id));
const chineseDependencies = dependencies.filter((edge) => chineseTopicIds.has(edge.topicId) || chineseTopicIds.has(edge.prerequisiteId));
assert(chineseTopics.length === 3, 'The first Chinese Language Arts path must contain exactly three topics');
assert(chineseDependencies.length === 2, 'The first Chinese Language Arts path must contain exactly two dependencies');
assert(chineseDependencies.every((edge) => chineseTopicIds.has(edge.topicId) && chineseTopicIds.has(edge.prerequisiteId)), 'Chinese dependencies must stay inside the first-party Chinese path');

const mathTopicIds = new Set(topics.filter((topic) => topic.subject === 'Mathematics').map((topic) => topic.id));
const mathMissionIds = new Set(missions.filter((mission) => mission.topicIds.some((topicId) => mathTopicIds.has(topicId))).map((mission) => mission.id));
const mathRegionIds = new Set(regions.filter((region) => region.subject === 'Mathematics' && !region.comingSoon).map((region) => region.id));
for (const profile of contentProfiles) {
  assert(curricula.some((curriculum) => curriculum.slug === profile.frameworkSlug), `Lesson content profile ${profile.frameworkSlug} has no curriculum framework`);
  assert(profile.sourceUrls.length > 0, `Lesson content profile ${profile.frameworkSlug} needs sources`);
  assert(new Set(profile.regionOverrides.map((override) => override.regionId)).size === profile.regionOverrides.length, `Lesson content profile ${profile.frameworkSlug} has duplicate region overrides`);
  assert(profile.regionOverrides.every((override) => mathRegionIds.has(override.regionId)), `Lesson content profile ${profile.frameworkSlug} references an unknown math region`);
  assert(new Set(profile.topicOverrides.map((override) => override.topicId)).size === profile.topicOverrides.length, `Lesson content profile ${profile.frameworkSlug} has duplicate topic overrides`);
  assert(profile.topicOverrides.every((override) => mathTopicIds.has(override.topicId)), `Lesson content profile ${profile.frameworkSlug} references an unknown math topic`);
  assert(profile.topicOverrides.every((override) => ['verified', 'provisional', 'supplemental'].includes(override.placement.status)), `Lesson content profile ${profile.frameworkSlug} has an invalid review status`);
  assert(profile.topicOverrides.every((override) => override.placement.sourceLocator.length > 0), `Lesson content profile ${profile.frameworkSlug} needs source locators`);
  assert(new Set(profile.missionOverrides.map((override) => override.missionId)).size === profile.missionOverrides.length, `Lesson content profile ${profile.frameworkSlug} has duplicate mission overrides`);
  for (const override of profile.missionOverrides) {
    const mission = missions.find((candidate) => candidate.id === override.missionId);
    assert(mission && mathMissionIds.has(mission.id), `Lesson content profile ${profile.frameworkSlug} references unknown math mission ${override.missionId}`);
    assert(override.questions.length === mission.questions.length, `Lesson content mission ${override.missionId} question count mismatch`);
    assert(override.questions.every((question, index) => question.id === mission.questions[index].id), `Lesson content mission ${override.missionId} must preserve question IDs`);
    assert(override.questions.every((question) => question.options.includes(question.correctOption)), `Lesson content mission ${override.missionId} has an invalid answer`);
  }
}
const chinaContent = contentProfiles.find((profile) => profile.frameworkSlug === 'cn-2022-math');
assert(chinaContent, 'China lesson content profile is missing');
assert(chinaContent.locale === 'zh-CN' && chinaContent.currency === 'CNY', 'China lesson content locale or currency is invalid');
assert(chinaContent.topicOverrides.length === mathTopicIds.size, 'China lesson content must cover every math topic');
assert(chinaContent.missionOverrides.length === mathMissionIds.size, 'China lesson content must cover every math mission');
assert(chinaContent.regionOverrides.length === mathRegionIds.size, 'China lesson content must cover every math region');
assert(!JSON.stringify(chinaContent).includes('新台幣') && !JSON.stringify(chinaContent).includes('新台币'), 'China lesson content must not contain Taiwan currency');

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
console.log(`Curriculum overlays valid: ${curricula.length} frameworks, ${standardKeys.size} standards, Taiwan 108 + China 2022.`);
console.log(`Lesson content overlays valid: ${contentProfiles.length} profiles, ${mathTopicIds.size} shared Math topics, ${mathMissionIds.size} localized missions.`);
console.log(`Chinese Language Arts extension valid: ${chineseTopics.length} topics, ${chineseDependencies.length} dependencies, official locators + provisional product alignment.`);

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

const englishTopics = topics.filter((topic) => topic.subject === 'English');
const englishTopicIds = new Set(englishTopics.map((topic) => topic.id));
const englishOverlays = englishCourseFile.topicOverlays;
const englishScenarios = englishCourseFile.scenarios;
const overlayTopicIds = new Set(englishOverlays.map((overlay) => overlay.topicId));
const overlayMarbleIds = new Set(englishOverlays.map((overlay) => overlay.marbleTopicId));
const coveredEnglishTopicIds = new Set(englishScenarios.flatMap((scenario) => scenario.evidenceTopicIds));

assert(englishCourseFile.mappingKind === 'narrowed-local-adaptation', 'English course must remain a narrowed local adaptation');
assert(englishCourseFile.dependencyModel === 'oshiami-local-course-order', 'English dependencies must be labelled as Oshiami course order');
assert(englishCourseFile.upstreamCommit === marbleTopicFile.upstreamCommit, 'English course Marble mapping commit drifted from the imported snapshot');
assert(englishOverlays.length === 12 && englishTopics.length === 12, 'English course needs exactly twelve active topics');
assert(overlayTopicIds.size === englishOverlays.length, 'English course has duplicate local topic mappings');
assert(overlayMarbleIds.size === englishOverlays.length, 'English course has duplicate Marble topic mappings');
assert(englishTopicIds.size === overlayTopicIds.size && [...englishTopicIds].every((topicId) => overlayTopicIds.has(topicId)), 'English course mapping must cover every local English topic');
for (const overlay of englishOverlays) {
  const marbleTopic = marbleTopics.find((topic) => topic.id === overlay.marbleTopicId);
  assert(marbleTopic?.subject === 'English', `English overlay ${overlay.topicId} references a non-English Marble topic`);
  assert(marbleTopic.name === overlay.marbleTopicName, `English overlay ${overlay.topicId} source name drifted`);
}
assert(englishScenarios.length === 10, 'English course needs exactly ten playable scenarios');
assert(new Set(englishScenarios.map((scenario) => scenario.id)).size === englishScenarios.length, 'English scenario IDs must be unique');
assert(new Set(englishScenarios.map((scenario) => scenario.primaryTopicId)).size === englishScenarios.length, 'English scenarios need unique primary topics');
for (const scenario of englishScenarios) {
  assert(['word', 'speaking', 'card'].includes(scenario.kind), `English scenario ${scenario.id} has an invalid kind`);
  assert(overlayTopicIds.has(scenario.primaryTopicId), `English scenario ${scenario.id} has an unknown primary topic`);
  assert(scenario.evidenceTopicIds.includes(scenario.primaryTopicId), `English scenario ${scenario.id} must record its primary topic`);
  assert(scenario.evidenceTopicIds.every((topicId) => overlayTopicIds.has(topicId)), `English scenario ${scenario.id} has unknown evidence topics`);
  assert(scenario.intentChoices.includes(scenario.correctIntent), `English scenario ${scenario.id} has an invalid intent answer`);
  assert(scenario.tokens.length > 0 && new Set(scenario.tokens).size === scenario.tokens.length, `English scenario ${scenario.id} needs unique ordered tokens`);
  const expectedTiles = [...scenario.tokens, ...scenario.distractors].sort();
  assert(scenario.tileChoices.length === expectedTiles.length, `English scenario ${scenario.id} tile count drifted`);
  assert(JSON.stringify([...scenario.tileChoices].sort()) === JSON.stringify(expectedTiles), `English scenario ${scenario.id} tiles must match its tokens and distractors`);
  assert(JSON.stringify(scenario.tileChoices.slice(0, scenario.tokens.length)) !== JSON.stringify(scenario.tokens), `English scenario ${scenario.id} must not display its answer in order`);
  if (scenario.kind === 'card') {
    assert(scenario.intentChoices[0] !== scenario.correctIntent, `English scenario ${scenario.id} must not put the correct intent first`);
  }
  assert(scenario.modelText.length > 0 && scenario.reviewPoint.length > 0, `English scenario ${scenario.id} needs visible fallback content`);
}
assert([...overlayTopicIds].every((topicId) => coveredEnglishTopicIds.has(topicId)), 'Every English topic needs playable evidence coverage');

console.log(`English course overlay valid: ${englishOverlays.length} Marble-aligned topics, ${englishScenarios.length} playable scenarios, full evidence coverage.`);
