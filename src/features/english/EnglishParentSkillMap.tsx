import {ArrowRight, CheckCircle, ClockCounterClockwise, Graph} from '@phosphor-icons/react';
import type {LearnerTopicState} from '../../types';
import {buildEnglishPath} from './englishPath';

interface EnglishParentSkillMapProps {
  states: LearnerTopicState[];
  recommendationReason: string;
}

const statusCopy = {
  mastered: '已掌握',
  current: '正在建立',
  upcoming: '尚未開始',
} as const;

export function EnglishParentSkillMap({states, recommendationReason}: EnglishParentSkillMapProps) {
  const path = buildEnglishPath(states);
  const masteredCount = path.filter((node) => node.status === 'mastered').length;

  return (
    <main id="parent-skill-graph" className="english-parent-map">
      <header className="parent-map-heading">
        <div>
          <span><Graph aria-hidden="true" /> 家長技能圖</span>
          <h1>三個能力，看懂孩子下一步</h1>
          <p>不顯示完整 698 節點資料庫；只顯示目前英文課真正使用的課程子圖。</p>
        </div>
        <div className="parent-mastery-summary" aria-label={`已掌握 ${masteredCount} 個，共 3 個英文能力`}>
          <strong>{masteredCount}<small> / 3</small></strong>
          <span>英文能力已掌握</span>
        </div>
      </header>

      <section className="parent-next-step" aria-label="下一步推薦">
        <span className="english-coach-mark" aria-hidden="true">芽</span>
        <div><strong>下一步推薦</strong><p>{recommendationReason}</p></div>
      </section>

      <ol className="parent-skill-sequence" aria-label="英文能力的建議學習順序">
        {path.map((node, index) => {
          const masteryPercent = Math.round(node.state.mastery * 100);
          return (
            <li key={node.topic.id} className={`parent-node-${node.status}`}>
              {index > 0 ? (
                <div className="parent-dag-connector" aria-label={`${path[index - 1].topic.name} 是 ${node.topic.name} 的建議前置能力`}>
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
                <p>{node.topic.description}</p>
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
                <dl>
                  <div><dt>練習</dt><dd>{node.state.attempts} 次</dd></div>
                  <div><dt>提示</dt><dd>{node.state.hintCount} 次</dd></div>
                  <div><dt>重試</dt><dd>{node.state.retryCount} 次</dd></div>
                </dl>
                {node.state.lastPracticedAt ? (
                  <span className="parent-last-practiced"><ClockCounterClockwise aria-hidden="true" /> 有近期學習紀錄</span>
                ) : <span className="parent-last-practiced">尚無學習證據</span>}
              </article>
            </li>
          );
        })}
      </ol>

      <footer className="parent-map-footer">
        <p>實線順序代表這個產品目前採用的學習路徑；「建議前置」保留原 taxonomy 的 soft dependency 語意。</p>
        <a href="https://github.com/withmarbleapp/os-taxonomy" target="_blank" rel="noreferrer">Marble Skill Taxonomy v1 · attribution</a>
      </footer>
    </main>
  );
}
