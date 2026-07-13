import type {LearningEvidence} from '../../types';
import type {LessonEvidenceSummary} from './PlaceValueLesson';

export const PLACE_VALUE_TOPIC_IDS = [
  'tw_math_g1_count_20',
  'tw_math_g1_bundle_ten',
  'tw_math_g1_tens_ones',
] as const;

export function createPlaceValueEvidence(summary: LessonEvidenceSummary, occurredAt: string): LearningEvidence[] {
  return PLACE_VALUE_TOPIC_IDS.map((topicId) => ({
    topicId,
    correct: true,
    hintCount: summary.hintCount,
    retryCount: summary.retryCount,
    occurredAt,
  }));
}
