import {dependencies, topics} from '../../lib/curriculum';
import {MASTERY_THRESHOLD} from '../../lib/mastery';
import type {Dependency, LearnerTopicState, Topic} from '../../types';

export const ENGLISH_PATH_TOPIC_IDS = [
  'tw_eng_g1_letter_sounds',
  'tw_eng_g1_sight_words',
  'tw_eng_g1_greetings',
] as const;

export type EnglishPathStatus = 'mastered' | 'current' | 'upcoming';

export interface EnglishPathNode {
  topic: Topic;
  state: LearnerTopicState;
  incoming: Dependency | null;
  status: EnglishPathStatus;
}

export function buildEnglishPath(states: LearnerTopicState[]): EnglishPathNode[] {
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  const stateById = new Map(states.map((state) => [state.topicId, state]));
  const pathTopics = ENGLISH_PATH_TOPIC_IDS.map((topicId) => topicById.get(topicId)!);
  const currentTopic = pathTopics.find((topic) => stateById.get(topic.id)!.mastery < MASTERY_THRESHOLD);

  return pathTopics.map((topic, index) => {
    const state = stateById.get(topic.id)!;
    const mastered = state.mastery >= MASTERY_THRESHOLD;
    return {
      topic,
      state,
      incoming: index === 0
        ? null
        : dependencies.find((edge) => edge.prerequisiteId === pathTopics[index - 1].id && edge.topicId === topic.id) ?? null,
      status: mastered ? 'mastered' : topic.id === currentTopic?.id ? 'current' : 'upcoming',
    };
  });
}
