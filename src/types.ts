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
  version: 1;
  childAlias: string;
  completedMissionIds: string[];
  xp: number;
  updatedAt: string;
}
