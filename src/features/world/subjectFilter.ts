export type LearningSubject = 'Mathematics' | 'English';

export function toggleVisibleSubject(current: Set<LearningSubject>, subject: LearningSubject) {
  const next = new Set(current);
  if (next.has(subject) && next.size > 1) next.delete(subject);
  else next.add(subject);
  return next;
}

export function selectionShouldClear(
  selectedSubject: string | undefined,
  toggledSubject: LearningSubject,
  current: Set<LearningSubject>,
) {
  return selectedSubject === toggledSubject && current.has(toggledSubject) && current.size > 1;
}
