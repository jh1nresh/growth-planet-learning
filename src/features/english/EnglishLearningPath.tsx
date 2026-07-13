import {ArrowRight, CheckCircle, LockKey, SpeakerHigh} from '@phosphor-icons/react';
import type {LearnerTopicState} from '../../types';
import {learningStudios, type LearningStudio} from '../learning/learningStudios';
import {buildSubjectPath} from './englishPath';

interface SubjectLearningPathProps {
  states: LearnerTopicState[];
  studio: LearningStudio;
  onStartLesson: () => void;
}

const statusCopy = {
  mastered: '已掌握',
  current: '現在學這個',
  upcoming: '待解鎖',
} as const;

export function SubjectLearningPath({states, studio, onStartLesson}: SubjectLearningPathProps) {
  const path = buildSubjectPath(studio.subject, states);

  return (
    <section className="english-growth-path" aria-labelledby="growth-path-title">
      <header>
        <span>{studio.pathEyebrow}</span>
        <h1 id="growth-path-title">{studio.pathTitle}</h1>
        <p>{studio.pathDescription} 每一步都對應可計算能力，線條直接來自 prerequisite DAG。</p>
      </header>

      <ol>
        {path.map((node, index) => {
          const softUpcoming = node.status === 'upcoming' && node.incoming?.strength === 'soft';
          return (
            <li key={node.topic.id} className={`path-${node.status}`} aria-current={node.status === 'current' ? 'step' : undefined}>
              <span className="child-path-index" aria-hidden="true">
                {node.status === 'mastered' ? <CheckCircle weight="fill" /> : node.status === 'upcoming' && !softUpcoming ? <LockKey weight="fill" /> : index + 1}
              </span>
              <div className="child-path-copy">
                <span className="child-path-status">{softUpcoming ? '可先探索' : statusCopy[node.status]}</span>
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
                  {node.status === 'mastered' ? '已完成這一步' : node.status === 'current' ? '下一堂互動課正在準備' : softUpcoming ? '建議先完成前一步；內容準備中' : '完成前一步後開放'}
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

export function EnglishLearningPath({states, onStartLesson}: Omit<SubjectLearningPathProps, 'studio'>) {
  return <SubjectLearningPath states={states} studio={learningStudios.English} onStartLesson={onStartLesson} />;
}
