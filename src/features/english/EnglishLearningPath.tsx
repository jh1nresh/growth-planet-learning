import {ArrowRight, CheckCircle, LockKey, SpeakerHigh} from '@phosphor-icons/react';
import type {LearnerTopicState} from '../../types';
import {buildEnglishPath} from './englishPath';

interface EnglishLearningPathProps {
  states: LearnerTopicState[];
  onStartLesson: () => void;
}

const statusCopy = {
  mastered: '已掌握',
  current: '現在學這個',
  upcoming: '待解鎖',
} as const;

export function EnglishLearningPath({states, onStartLesson}: EnglishLearningPathProps) {
  const path = buildEnglishPath(states);

  return (
    <section className="english-growth-path" aria-labelledby="growth-path-title">
      <header>
        <span>我的英文成長</span>
        <h1 id="growth-path-title">從聲音，走到第一句話</h1>
        <p>每一步都對應一個可計算能力；線條來自現有的 prerequisite DAG。</p>
      </header>

      <ol>
        {path.map((node, index) => (
          <li key={node.topic.id} className={`path-${node.status}`}>
            <span className="child-path-index" aria-hidden="true">
              {node.status === 'mastered' ? <CheckCircle weight="fill" /> : node.status === 'upcoming' ? <LockKey weight="fill" /> : index + 1}
            </span>
            <div className="child-path-copy">
              <span className="child-path-status">{statusCopy[node.status]}</span>
              <h2>{node.topic.name}</h2>
              <p>{node.topic.description}</p>
              <small>{node.topic.evidence[0]}</small>
            </div>
            {index === 0 ? (
              <button type="button" onClick={onStartLesson}>
                <SpeakerHigh aria-hidden="true" /> {node.status === 'mastered' ? '再玩一次 CAT' : '開始 CAT 互動課'} <ArrowRight aria-hidden="true" />
              </button>
            ) : (
              <span className="child-path-coming">
                {node.status === 'current' ? '下一堂互動課正在準備' : '完成前一步後開放'}
              </span>
            )}
          </li>
        ))}
      </ol>

      <a href="https://github.com/withmarbleapp/os-taxonomy" target="_blank" rel="noreferrer">
        課程關係參考 Marble Skill Taxonomy v1
      </a>
    </section>
  );
}
