import overlayFile from '../data/lesson-content-overlays.json';
import type {CurriculumFrameworkSlug, Mission, MissionQuestion, Topic, WorldRegion} from '../types';

export type ContentReviewStatus = 'verified' | 'provisional' | 'supplemental';

export interface TopicPlacement {
  semester: string;
  unit: string;
  sequence: number;
  status: ContentReviewStatus;
  sourceLocator: string;
}

interface TopicContentOverride {
  topicId: string;
  name: string;
  description: string;
  evidence: string[];
  assessmentPrompt: string;
  placement: TopicPlacement;
}

interface MissionContentOverride {
  missionId: string;
  title: string;
  questions: MissionQuestion[];
}

interface RegionContentOverride {
  regionId: string;
  name: string;
  shortName: string;
  description: string;
  summary: string;
}

export type LocalizedWorldRegion = WorldRegion & {contentSummary?: string};

export interface PlaceValueLessonContent {
  subjectLine: string;
  title: string;
  currentLabel: string;
  instructionEyebrow: string;
  instructionTitle: string;
  instructionBody: string;
  backLabel: string;
  addLabel: string;
  removeLabel: string;
  bundleLabel: string;
  coachLabel: string;
  hintLabel: string;
  checkLabel: string;
  question: string;
  completeTitle: string;
  completeBody: string;
  nextLabel: string;
  messages: {
    initial: string;
    added: string;
    bundled: string;
    thirdBundle: string;
    built: string;
    tooLow: string;
    tooHigh: string;
    wrongAnswer: string;
    correctAnswer: string;
    hintBundle: string;
    hintOnes: string;
  };
  canvas: {
    materials: string;
    dragOne: string;
    tens: string;
    ones: string;
    tenCount: string;
    oneCount: string;
  };
}

export interface LessonContentProfile {
  frameworkSlug: CurriculumFrameworkSlug;
  label: string;
  locale: 'zh-TW' | 'zh-CN';
  currency: 'TWD' | 'CNY';
  currencyName: string;
  publisherProfile: string;
  sourceUrls: string[];
  regionOverrides: RegionContentOverride[];
  topicOverrides: TopicContentOverride[];
  missionOverrides: MissionContentOverride[];
  placeValueLesson: PlaceValueLessonContent;
}

export const lessonContentProfiles = overlayFile.profiles as LessonContentProfile[];
const profileBySlug = new Map(lessonContentProfiles.map((profile) => [profile.frameworkSlug, profile]));

export function getLessonContentProfile(frameworkSlug: CurriculumFrameworkSlug) {
  const profile = profileBySlug.get(frameworkSlug);
  if (!profile) throw new Error(`Unknown lesson content profile: ${frameworkSlug}`);
  return profile;
}

export function getTopicContent(frameworkSlug: CurriculumFrameworkSlug, topic: Topic): Topic & {placement?: TopicPlacement} {
  const override = getLessonContentProfile(frameworkSlug).topicOverrides.find((candidate) => candidate.topicId === topic.id);
  return override ? {
    ...topic,
    name: override.name,
    description: override.description,
    evidence: override.evidence,
    assessmentPrompt: override.assessmentPrompt,
    placement: override.placement,
  } : topic;
}

export function getMissionContent(frameworkSlug: CurriculumFrameworkSlug, mission: Mission): Mission {
  const override = getLessonContentProfile(frameworkSlug).missionOverrides.find((candidate) => candidate.missionId === mission.id);
  return override ? {...mission, title: override.title, questions: override.questions} : mission;
}

export function getRegionContent(frameworkSlug: CurriculumFrameworkSlug, region: WorldRegion): LocalizedWorldRegion {
  const override = getLessonContentProfile(frameworkSlug).regionOverrides.find((candidate) => candidate.regionId === region.id);
  return override ? {
    ...region,
    name: override.name,
    shortName: override.shortName,
    description: override.description,
    contentSummary: override.summary,
  } : region;
}

export function getPlaceValueLessonContent(frameworkSlug: CurriculumFrameworkSlug) {
  return getLessonContentProfile(frameworkSlug).placeValueLesson;
}

export function localizeRecommendationReason(frameworkSlug: CurriculumFrameworkSlug, reason: string) {
  if (frameworkSlug === 'tw-108-math') return reason;
  const replacements: Array<[string, string]> = [
    ['進入', '进入'], ['練穩', '练稳'], ['再練一次', '再练一次'], ['這一輪', '这一轮'],
    ['數學', '数学'], ['英文', '英语'], ['複習', '复习'], ['你已經會', '你已经会'],
    ['接著學', '接着学'], ['先從', '先从'], ['開始', '开始'], ['讓芽芽', '让芽芽'],
    ['什麼', '什么'], ['正在成形', '正在形成'],
  ];
  return replacements.reduce((copy, [traditional, simplified]) => copy.replaceAll(traditional, simplified), reason);
}
