import standardFile from '../data/curriculum-standards.json';
import {dependencies, topics} from './curriculum';
import {getRecommendation} from './mastery';
import type {CurriculumFramework, CurriculumFrameworkSlug, Dependency, LearnerTopicState, Topic} from '../types';

export const curriculumFrameworks = standardFile.curricula as CurriculumFramework[];
export const curriculumFrameworkBySlug = new Map(curriculumFrameworks.map((framework) => [framework.slug, framework]));
export const curriculumStandardByKey = new Map(curriculumFrameworks.flatMap((framework) => framework.topics).map((standard) => [standard.key, standard]));

function topologicalTopics(selectedTopics: Topic[], selectedDependencies: Dependency[]) {
  const order = new Map(selectedTopics.map((topic, index) => [topic.id, index]));
  const indegree = new Map(selectedTopics.map((topic) => [topic.id, 0]));
  const outgoing = new Map(selectedTopics.map((topic) => [topic.id, [] as string[]]));
  for (const edge of selectedDependencies) {
    indegree.set(edge.topicId, (indegree.get(edge.topicId) ?? 0) + 1);
    outgoing.get(edge.prerequisiteId)?.push(edge.topicId);
  }
  const ready = selectedTopics.filter((topic) => indegree.get(topic.id) === 0);
  const result: Topic[] = [];
  while (ready.length) {
    ready.sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
    const topic = ready.shift();
    if (!topic) break;
    result.push(topic);
    for (const nextId of outgoing.get(topic.id) ?? []) {
      const nextDegree = (indegree.get(nextId) ?? 1) - 1;
      indegree.set(nextId, nextDegree);
      if (nextDegree === 0) {
        const nextTopic = selectedTopics.find((candidate) => candidate.id === nextId);
        if (nextTopic) ready.push(nextTopic);
      }
    }
  }
  if (result.length !== selectedTopics.length) throw new Error('Curriculum overlay contains a dependency cycle');
  return result;
}

export function getCurriculumGraph(frameworkSlug: CurriculumFrameworkSlug, grade: number) {
  const framework = curriculumFrameworkBySlug.get(frameworkSlug);
  if (!framework) throw new Error(`Unknown curriculum framework: ${frameworkSlug}`);
  if (!framework.implementedGrades.includes(grade)) {
    return {framework, standards: [], topics: [], dependencies: []};
  }
  const standards = framework.topics.filter((standard) => standard.data.grades.includes(grade));
  const standardKeys = new Set(standards.map((standard) => standard.key));
  const selectedTopics = topics.filter((topic) => topic.standards.some((key) => standardKeys.has(key)));
  const topicIds = new Set(selectedTopics.map((topic) => topic.id));
  const selectedDependencies = dependencies.filter((edge) => topicIds.has(edge.topicId) && topicIds.has(edge.prerequisiteId));
  return {
    framework,
    standards,
    topics: topologicalTopics(selectedTopics, selectedDependencies),
    dependencies: selectedDependencies,
  };
}

export function getCurriculumRecommendation(frameworkSlug: CurriculumFrameworkSlug, grade: number, learnerStates: LearnerTopicState[]) {
  const graph = getCurriculumGraph(frameworkSlug, grade);
  if (!graph.topics.length) throw new Error(`No aligned topics for ${frameworkSlug} grade ${grade}`);
  return getRecommendation('Mathematics', learnerStates, graph.topics, graph.dependencies);
}
