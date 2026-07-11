import {Calculator, CheckCircle, LockKey, Sparkle, Translate} from '@phosphor-icons/react';
import {clusters, dependencies, getRegionStatus, regions, topics} from '../../lib/curriculum';
import type {Subject} from '../../types';
import {buildConstellationLayout} from './constellationLayout';

const learningSubjects = ['Mathematics', 'English'] as const;
const regionById = new Map(regions.map((region) => [region.id, region]));
const regionIdByClusterId = new Map(regions.filter((region) => region.clusterId).map((region) => [region.clusterId, region.id] as const));
const regionIdByTopicId = new Map(clusters.flatMap((cluster) => cluster.topicIds.map((topicId) => [topicId, regionIdByClusterId.get(cluster.id)!] as const)));

const subjectCopy = {
  Mathematics: {name: '數學星系', description: '數感、位值、運算、圖形與測量', color: '#f3d781'},
  English: {name: '英文星系', description: '字母音、常見字與第一句表達', color: '#72d8e8'},
} as const;

interface SkillConstellationProps {
  activeSubject: Subject;
  selectedTopicId: string | null;
  completedMissionIds: Set<string>;
  onChooseSubject: (subject: Subject) => void;
  onSelectTopic: (topicId: string, regionId: string) => void;
}

export function SkillConstellation({activeSubject, selectedTopicId, completedMissionIds, onChooseSubject, onSelectTopic}: SkillConstellationProps) {
  const graph = buildConstellationLayout(activeSubject, topics, dependencies, regionIdByTopicId);
  const nodeByTopicId = new Map(graph.nodes.map((node) => [node.topic.id, node]));
  const activeCopy = subjectCopy[activeSubject as keyof typeof subjectCopy];

  return (
    <div className={`skill-constellation constellation-${activeSubject.toLowerCase()}`}>
      <div className="constellation-subjects" aria-label="選擇學習星系">
        {learningSubjects.map((subject) => {
          const copy = subjectCopy[subject];
          const count = topics.filter((topic) => topic.subject === subject).length;
          return (
            <button
              key={subject}
              className={activeSubject === subject ? 'is-active' : ''}
              type="button"
              onClick={() => onChooseSubject(subject)}
              aria-pressed={activeSubject === subject}
            >
              {subject === 'Mathematics' ? <Calculator aria-hidden="true" weight="duotone" /> : <Translate aria-hidden="true" weight="duotone" />}
              <span><strong>{copy.name}</strong><small>{count} 顆能力星</small></span>
            </button>
          );
        })}
      </div>

      <div className="constellation-heading">
        <span style={{color: activeCopy.color}}><Sparkle aria-hidden="true" weight="fill" /> {activeCopy.name}</span>
        <p>{activeCopy.description} · 線條代表先修關係</p>
      </div>

      <svg className="constellation-edges" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
        {graph.edges.map((edge) => {
          const source = nodeByTopicId.get(edge.prerequisiteId);
          const target = nodeByTopicId.get(edge.topicId);
          if (!source || !target) return null;
          return <line key={`${edge.prerequisiteId}-${edge.topicId}`} className={`edge-${edge.strength}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} />;
        })}
      </svg>

      <div className="constellation-nodes">
        {graph.nodes.map((node) => {
          const region = regionById.get(node.regionId);
          if (!region) return null;
          const status = getRegionStatus(region, completedMissionIds);
          const selected = selectedTopicId === node.topic.id;
          return (
            <button
              key={node.topic.id}
              className={`constellation-node node-${status}${selected ? ' is-selected' : ''}${node.topic.centrality >= 0.85 ? ' is-core' : ''}`}
              type="button"
              style={{left: `${node.x / 10}%`, top: `${node.y / 6.2}%`}}
              onClick={() => onSelectTopic(node.topic.id, node.regionId)}
              aria-label={`${node.topic.name}，${node.topic.domain}，${status === 'complete' ? '已完成' : status === 'available' ? '可以探索' : '尚未解鎖'}`}
              aria-pressed={selected}
            >
              <span className="node-star" aria-hidden="true">{status === 'complete' ? <CheckCircle weight="fill" /> : status === 'locked' ? <LockKey weight="fill" /> : <Sparkle weight="fill" />}</span>
              <span><strong>{node.topic.name}</strong><small>{node.topic.domain}</small></span>
            </button>
          );
        })}
      </div>

      <div className="constellation-legend" aria-hidden="true">
        <span><i className="legend-hard" /> 必要先修</span>
        <span><i className="legend-soft" /> 延伸連結</span>
        <span>由左到右逐步解鎖</span>
      </div>
    </div>
  );
}
