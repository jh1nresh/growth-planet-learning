import {ArrowRight, CheckCircle, ClockCounterClockwise, Graph} from '@phosphor-icons/react';
import type {LearnerTopicState} from '../../types';
import {learningStudios, type LearningStudio} from '../learning/learningStudios';
import {buildSubjectPath} from './englishPath';

interface ParentSkillMapProps {
  states: LearnerTopicState[];
  studio: LearningStudio;
  recommendationReason: string;
  onStartLesson: () => void;
}

const statusCopy = {
  mastered: '已掌握',
  current: '正在建立',
  upcoming: '尚未開始',
} as const;

export function ParentSkillMap({states, studio, recommendationReason, onStartLesson}: ParentSkillMapProps) {
  const path = buildSubjectPath(studio.subject, states);
  const masteredCount = path.filter((node) => node.status === 'mastered').length;
  const currentNode = path.find((node) => node.status === 'current');
  const canStartRecommendedLesson = !currentNode || studio.lessonEvidenceTopicIds.includes(currentNode.topic.id);

  return (
    <main id="parent-skill-graph" className="english-parent-map">
      <header className="parent-map-heading">
        <div>
          <span><Graph aria-hidden="true" /> 家長技能圖</span>
          <h1>三個能力，看懂孩子下一步</h1>
          <p>只顯示目前{studio.label}課真正使用的三個能力，讓前置關係、掌握證據與下一步保持清楚。</p>
        </div>
        <div className="parent-mastery-summary" aria-label={`已掌握 ${masteredCount} 個，共 3 個${studio.label}能力`}>
          <strong>{masteredCount}<small> / 3</small></strong>
          <span>{studio.label}能力已掌握</span>
        </div>
      </header>

      <section className="parent-next-step" aria-label="下一步推薦">
        <span className="english-coach-mark" aria-hidden="true">芽</span>
        <div><strong>下一步推薦</strong><p>{recommendationReason}</p></div>
        {canStartRecommendedLesson ? (
          <button className="english-primary-button" type="button" onClick={onStartLesson}>查看推薦課程 <ArrowRight aria-hidden="true" /></button>
        ) : <span className="parent-lesson-coming">下一堂互動課正在準備</span>}
      </section>

      <ol className="parent-skill-sequence" aria-label={`${studio.label}能力的建議學習順序`}>
        {path.map((node, index) => {
          const masteryPercent = Math.round(node.state.mastery * 100);
          const prerequisiteLabel = node.incoming?.strength === 'soft' ? '建議前置能力' : '必要前置能力';
          return (
            <li key={node.topic.id} className={`parent-node-${node.status}`}>
              {index > 0 ? (
                <div className="parent-dag-connector" aria-label={`${path[index - 1].topic.name} 是 ${node.topic.name} 的${prerequisiteLabel}`}>
                  <ArrowRight aria-hidden="true" />
                  <span>{node.incoming?.strength === 'soft' ? '建議前置' : '必要前置'}</span>
                </div>
              ) : null}
              <article>
                <div className="parent-node-heading">
                  <span className="parent-node-index" aria-hidden="true">{node.status === 'mastered' ? <CheckCircle weight="fill" /> : index + 1}</span>
                  <div><small>{node.topic.domain}</small><h2>{node.topic.name}</h2></div>
                  <span className="parent-node-status">{statusCopy[node.status]}</span>
                </div>
                <div
                  className="parent-mastery-bar"
                  role="progressbar"
                  aria-label={`${node.topic.name} 掌握度`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={masteryPercent}
                >
                  <span style={{width: `${masteryPercent}%`}} />
                </div>
                <strong className="parent-mastery-value">{masteryPercent}% 掌握</strong>
                <small className="parent-node-evidence">可觀察證據：{node.topic.evidence[0]}</small>
                <details className="parent-evidence-details">
                  <summary>查看學習紀錄</summary>
                  <dl>
                    <div><dt>練習</dt><dd>{node.state.attempts} 次</dd></div>
                    <div><dt>提示</dt><dd>{node.state.hintCount} 次</dd></div>
                    <div><dt>重試</dt><dd>{node.state.retryCount} 次</dd></div>
                  </dl>
                  {node.state.lastPracticedAt ? (
                    <span className="parent-last-practiced"><ClockCounterClockwise aria-hidden="true" /> 有近期學習紀錄</span>
                  ) : <span className="parent-last-practiced">尚無學習證據</span>}
                </details>
              </article>
            </li>
          );
        })}
      </ol>

      <footer className="parent-map-footer">
        <p>實線順序代表產品目前採用的學習路徑；「建議前置」保留 soft dependency 的可跨越語意。</p>
        <a href={studio.sourceUrl} target="_blank" rel="noreferrer">{studio.sourceLabel}</a>
      </footer>
    </main>
  );
}

export function EnglishParentSkillMap({states, recommendationReason, onStartLesson}: Omit<ParentSkillMapProps, 'studio'>) {
  return <ParentSkillMap states={states} studio={learningStudios.English} recommendationReason={recommendationReason} onStartLesson={onStartLesson} />;
}
