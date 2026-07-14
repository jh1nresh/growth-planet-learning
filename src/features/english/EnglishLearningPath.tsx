import {ArrowRight, CheckCircle, LockKey, SpeakerHigh} from '@phosphor-icons/react';
import type {LearnerTopicState} from '../../types';
import type {LearningStudio} from '../learning/learningStudios';
import {buildSubjectPath} from './englishPath';

interface SubjectLearningPathProps {
  states: LearnerTopicState[];
  studio: LearningStudio;
  onStartLesson: () => void;
}

const statusCopy = {
  mastered: '已掌握',
  current: '現在學這個',
  upcoming: '可探索',
} as const;

export function SubjectLearningPath({states, studio, onStartLesson}: SubjectLearningPathProps) {
  const path = buildSubjectPath(studio.subject, states);

  return (
    <section className="english-growth-path" aria-labelledby="growth-path-title">
      <header>
        <span>{studio.pathEyebrow}</span>
        <h1 id="growth-path-title">{studio.pathTitle}</h1>
        <p>{studio.pathDescription} 每一步都對應可計算能力，解鎖由 prerequisite DAG 決定。</p>
      </header>

      <ol>
        {path.map((node, index) => {
          return (
            <li key={node.topic.id} className={`path-${node.status}`} aria-current={node.status === 'current' ? 'step' : undefined}>
              <span className="child-path-index" aria-hidden="true">
                {node.status === 'mastered' ? <CheckCircle weight="fill" /> : node.hardLocked ? <LockKey weight="fill" /> : index + 1}
              </span>
              <div className="child-path-copy">
                <span className="child-path-status">{node.hardLocked ? '待解鎖' : statusCopy[node.status]}</span>
                <h2>{node.topic.name}</h2>
                <p>{node.topic.description}</p>
                <small>{node.topic.evidence[0]}</small>
              </div>
              {node.status === 'current' && studio.lessonEvidenceTopicIds.includes(node.topic.id) ? (
                <button type="button" onClick={onStartLesson}>
                  <SpeakerHigh aria-hidden="true" /> 開始{studio.lessonName} <ArrowRight aria-hidden="true" />
                </button>
              ) : (
                <span className="child-path-coming">
                  {node.status === 'mastered' ? '已完成這一步' : node.status === 'current' ? '從今天開始這堂課' : node.hardLocked ? '完成必要前置能力後開放' : '已開放，可在推薦課程之後練習'}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <a href={studio.sourceUrl} target="_blank" rel="noreferrer">
        {studio.sourceLabel}
      </a>
    </section>
  );
}
