export type Subject = 'Mathematics' | 'English' | 'Science' | 'Life Skills';

export type TopicType = 'CONCEPTUAL' | 'PROCEDURAL' | 'REPRESENTATIONAL' | 'LANGUAGE' | 'META';

export interface Topic {
  id: string;
  type: TopicType;
  subject: Subject;
  domain: string;
  name: string;
  description: string;
  ageRangeStart: number;
  ageRangeEnd: number;
  centrality: number;
  evidence: string[];
  assessmentPrompt: string;
  standards: string[];
}

export interface Dependency {
  topicId: string;
  prerequisiteId: string;
  strength: 'hard' | 'soft';
  reason: string;
}

export interface Cluster {
  id: string;
  subject: Subject;
  domain: string;
  ageBand: string;
  name: string;
  summary: string;
  topicIds: string[];
}

export interface MissionQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctOption: string;
  hint: string;
  explanation: string;
}

export interface Mission {
  id: string;
  regionId: string;
  title: string;
  durationMinutes: number;
  xp: number;
  topicIds: string[];
  questions: MissionQuestion[];
}

export interface WorldRegion {
  id: string;
  subject: Subject;
  clusterId: string | null;
  name: string;
  shortName: string;
  description: string;
  latitude: number;
  longitude: number;
  order: number;
  color: string;
  comingSoon?: boolean;
}

export interface ProgressState {
  version: 2;
  childAlias: string;
  completedMissionIds: string[];
  topicStates: LearnerTopicState[];
  xp: number;
  updatedAt: string;
}

export interface LearnerTopicState {
  topicId: string;
  mastery: number;
  attempts: number;
  correctAttempts: number;
  hintCount: number;
  retryCount: number;
  lastPracticedAt: string | null;
}

export interface LearningEvidence {
  topicId: string;
  correct: boolean;
  hintCount: number;
  retryCount: number;
  occurredAt: string;
}

export type CurriculumAlignmentStatus = 'verified' | 'provisional';
export type CurriculumCodeOrigin = 'official' | 'internal-locator';

export interface CurriculumStandardData {
  title: string;
  subject: Subject;
  domain: string;
  gradeBand: string;
  grades: number[];
  sourceLocator: string;
  alignmentStatus: CurriculumAlignmentStatus;
  codeOrigin: CurriculumCodeOrigin;
}

export interface CurriculumStandard {
  key: string;
  code: string;
  data: CurriculumStandardData;
}

export interface CurriculumFramework {
  slug: string;
  country: 'TW' | 'CN';
  name: string;
  version: string;
  implementedGrades: number[];
  sourceUrl: string;
  textIncluded: boolean;
  license: string;
  topicCount: number;
  topics: CurriculumStandard[];
}
