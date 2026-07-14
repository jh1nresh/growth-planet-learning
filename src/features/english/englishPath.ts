import {dependencies, topics} from '../../lib/curriculum';
import {MASTERY_THRESHOLD} from '../../lib/mastery';
import type {Dependency, LearnerTopicState, Topic} from '../../types';
import {learningStudios, type LearningSubject} from '../learning/learningStudios';
import {getEnglishCourseSelection} from './englishCourse';

export type EnglishPathStatus = 'mastered' | 'current' | 'upcoming';

export interface EnglishPathNode {
  topic: Topic;
  state: LearnerTopicState;
  incoming: Dependency | null;
  prerequisites: Dependency[];
  hardLocked: boolean;
  status: EnglishPathStatus;
}

export function buildSubjectPath(subject: LearningSubject, states: LearnerTopicState[]): EnglishPathNode[] {
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  const stateById = new Map(states.map((state) => [state.topicId, state]));
  const pathTopics = learningStudios[subject].topicIds.map((topicId) => topicById.get(topicId)!);
  const firstUnmastered = pathTopics.find((topic) => stateById.get(topic.id)!.mastery < MASTERY_THRESHOLD);
  const recommendedEnglish = subject === 'English' ? getEnglishCourseSelection(states).topic : null;
  const currentTopic = recommendedEnglish && stateById.get(recommendedEnglish.id)!.mastery < MASTERY_THRESHOLD
    ? recommendedEnglish
    : firstUnmastered;

  return pathTopics.map((topic, index) => {
    const state = stateById.get(topic.id)!;
    const mastered = state.mastery >= MASTERY_THRESHOLD;
    const prerequisites = dependencies
      .filter((edge) => edge.topicId === topic.id)
      .filter((edge) => pathTopics.slice(0, index).some((candidate) => candidate.id === edge.prerequisiteId));
    const incoming = [...prerequisites]
      .sort((a, b) => pathTopics.findIndex((candidate) => candidate.id === b.prerequisiteId)
        - pathTopics.findIndex((candidate) => candidate.id === a.prerequisiteId))[0] ?? null;
    const hardLocked = prerequisites.some((edge) => edge.strength === 'hard'
      && stateById.get(edge.prerequisiteId)!.mastery < MASTERY_THRESHOLD);
    return {
      topic,
      state,
      incoming,
      prerequisites,
      hardLocked,
      status: mastered ? 'mastered' : topic.id === currentTopic?.id ? 'current' : 'upcoming',
    };
  });
}

export function buildEnglishPath(states: LearnerTopicState[]): EnglishPathNode[] {
  return buildSubjectPath('English', states);
}
