import courseFile from '../../data/english-course-overlays.json';
import {dependencies, topics} from '../../lib/curriculum';
import {getRecommendation, MASTERY_THRESHOLD} from '../../lib/mastery';
import type {LearnerTopicState, Topic} from '../../types';

export type EnglishLessonKind = 'word' | 'speaking' | 'card' | 'room';

export interface EnglishTopicOverlay {
  topicId: string;
  marbleTopicId: string;
  marbleTopicName: string;
}

export interface EnglishCourseScenario {
  id: string;
  kind: EnglishLessonKind;
  primaryTopicId: string;
  evidenceTopicIds: string[];
  scene: string;
  title: string;
  modelText: string;
  translation: string;
  intentPrompt: string;
  intentChoices: string[];
  correctIntent: string;
  tokens: string[];
  distractors: string[];
  tileChoices: string[];
  reviewPoint: string;
}

export interface EnglishCourseSelection {
  topic: Topic;
  scenario: EnglishCourseScenario;
  reason: string;
}

export const englishTopicOverlays = courseFile.topicOverlays as EnglishTopicOverlay[];
export const ENGLISH_COURSE_TOPIC_IDS = englishTopicOverlays.map((overlay) => overlay.topicId);
export const englishCourseScenarios = courseFile.scenarios as EnglishCourseScenario[];

export function getEnglishScenarioForTopic(topicId: string) {
  return englishCourseScenarios.find((scenario) => scenario.evidenceTopicIds.includes(topicId));
}

export function getEnglishCourseSelection(states: LearnerTopicState[]): EnglishCourseSelection {
  const activeTopics = topics.filter((topic) => ENGLISH_COURSE_TOPIC_IDS.includes(topic.id));
  const stateById = new Map(states.map((state) => [state.topicId, state]));
  const allMastered = activeTopics.every((topic) => (stateById.get(topic.id)?.mastery ?? 0) >= MASTERY_THRESHOLD);

  if (allMastered) {
    const scenario = englishCourseScenarios.at(-1)!;
    const topic = activeTopics.find((candidate) => candidate.id === scenario.primaryTopicId)!;
    return {topic, scenario, reason: `這一輪的英文能力都已掌握，今天用「${topic.name}」做一次短複習。`};
  }

  const recommendation = getRecommendation('English', states, activeTopics, dependencies);
  const scenario = getEnglishScenarioForTopic(recommendation.topic.id);
  if (!scenario) throw new Error(`No English scenario for topic: ${recommendation.topic.id}`);
  return {...recommendation, scenario};
}
