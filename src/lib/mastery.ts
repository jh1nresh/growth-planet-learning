import type {Dependency, LearnerTopicState, LearningEvidence, Subject, Topic} from '../types';

export const MASTERY_THRESHOLD = 0.7;

export interface TopicRecommendation {
  topic: Topic;
  reason: string;
}

export function emptyTopicStates(topicList: Topic[]): LearnerTopicState[] {
  return topicList.map((topic) => ({
    topicId: topic.id,
    mastery: 0,
    attempts: 0,
    correctAttempts: 0,
    hintCount: 0,
    retryCount: 0,
    lastPracticedAt: null,
  }));
}

export function recordLearningEvidence(states: LearnerTopicState[], evidence: LearningEvidence): LearnerTopicState[] {
  return states.map((state) => {
    if (state.topicId !== evidence.topicId) return state;
    const independence = Math.max(0.35, 1 - evidence.hintCount * 0.2 - evidence.retryCount * 0.15);
    const mastery = evidence.correct
      ? state.mastery + (1 - state.mastery) * 0.72 * independence
      : state.mastery * 0.85;

    return {
      ...state,
      mastery: Math.round(Math.min(1, Math.max(0, mastery)) * 1000) / 1000,
      attempts: state.attempts + 1,
      correctAttempts: state.correctAttempts + (evidence.correct ? 1 : 0),
      hintCount: state.hintCount + evidence.hintCount,
      retryCount: state.retryCount + evidence.retryCount,
      lastPracticedAt: evidence.occurredAt,
    };
  });
}

function masteryByTopic(states: LearnerTopicState[]) {
  return new Map(states.map((state) => [state.topicId, state.mastery]));
}

function hardPrerequisites(topicId: string, edges: Dependency[]) {
  return edges.filter((edge) => edge.topicId === topicId && edge.strength === 'hard');
}

function nearestUnmetPrerequisite(topicId: string, mastery: Map<string, number>, edges: Dependency[], seen = new Set<string>()): string | null {
  if (seen.has(topicId)) return null;
  seen.add(topicId);

  for (const edge of hardPrerequisites(topicId, edges)) {
    if ((mastery.get(edge.prerequisiteId) ?? 0) >= MASTERY_THRESHOLD) continue;
    return nearestUnmetPrerequisite(edge.prerequisiteId, mastery, edges, seen) ?? edge.prerequisiteId;
  }
  return null;
}

export function getRecommendationForTopic(
  topicId: string,
  states: LearnerTopicState[],
  topicList: Topic[],
  edges: Dependency[],
): TopicRecommendation {
  const byId = new Map(topicList.map((topic) => [topic.id, topic]));
  const target = byId.get(topicId);
  if (!target) throw new Error(`Unknown topic: ${topicId}`);
  const stateById = new Map(states.map((state) => [state.topicId, state]));
  const unmetId = nearestUnmetPrerequisite(topicId, masteryByTopic(states), edges);
  const topic = unmetId ? byId.get(unmetId) ?? target : target;
  const state = stateById.get(topic.id);

  if (unmetId) {
    return {topic, reason: `要進入「${target.name}」，先把「${topic.name}」練穩。`};
  }
  if (state && state.attempts > 0 && state.mastery < MASTERY_THRESHOLD) {
    return {topic, reason: `「${topic.name}」正在成形，再練一次就會更穩。`};
  }
  if (state && state.mastery >= MASTERY_THRESHOLD) {
    return {topic, reason: `這一輪的「${target.subject === 'Mathematics' ? '數學' : '英文'}」能力都已掌握，今天用「${topic.name}」做一次短複習。`};
  }
  const masteredPrerequisite = hardPrerequisites(topic.id, edges)
    .map((edge) => byId.get(edge.prerequisiteId))
    .find(Boolean);
  return {
    topic,
    reason: masteredPrerequisite
      ? `你已經會「${masteredPrerequisite.name}」，接著學「${topic.name}」。`
      : `先從「${topic.name}」開始，讓芽芽看看你已經會什麼。`,
  };
}

export function getRecommendation(
  subject: Subject,
  states: LearnerTopicState[],
  topicList: Topic[],
  edges: Dependency[],
): TopicRecommendation {
  const mastery = masteryByTopic(states);
  const candidates = topicList.filter((topic) => topic.subject === subject);
  const eligible = candidates.find((topic) => {
    if ((mastery.get(topic.id) ?? 0) >= MASTERY_THRESHOLD) return false;
    return hardPrerequisites(topic.id, edges).every((edge) => (mastery.get(edge.prerequisiteId) ?? 0) >= MASTERY_THRESHOLD);
  });
  const topic = eligible ?? candidates.find((candidate) => (mastery.get(candidate.id) ?? 0) < MASTERY_THRESHOLD) ?? candidates[0];
  if (!topic) throw new Error(`No topics for subject: ${subject}`);
  return getRecommendationForTopic(topic.id, states, topicList, edges);
}
