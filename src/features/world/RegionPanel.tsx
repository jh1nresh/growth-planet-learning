import {CheckCircle, Clock, LockKey, MapPin, Play, Sparkle} from '@phosphor-icons/react';
import {clusterById, missionByRegionId, topicById} from '../../lib/curriculum';
import type {WorldRegion} from '../../types';

interface RegionPanelProps {
  region: WorldRegion;
  selectedTopicId: string | null;
  status: 'coming-soon' | 'locked' | 'complete' | 'available';
  onStartMission: () => void;
}

export function RegionPanel({region, selectedTopicId, status, onStartMission}: RegionPanelProps) {
  const cluster = region.clusterId ? clusterById.get(region.clusterId) : undefined;
  const mission = missionByRegionId.get(region.id);
  const topicNames = cluster?.topicIds.map((id) => topicById.get(id)?.name).filter(Boolean) ?? [];
  const selectedTopic = selectedTopicId ? topicById.get(selectedTopicId) : undefined;
  const locked = status === 'locked' || status === 'coming-soon';

  return (
    <aside className="region-panel" aria-labelledby="region-title">
      <div className="region-heading">
        <span className={`region-status region-status-${status}`}>
          {status === 'complete' ? <CheckCircle aria-hidden="true" weight="fill" /> : locked ? <LockKey aria-hidden="true" weight="fill" /> : <MapPin aria-hidden="true" weight="fill" />}
          {status === 'complete' ? '已點亮' : status === 'available' ? '可以探索' : status === 'coming-soon' ? '即將開放' : '先完成前一站'}
        </span>
        <h2 id="region-title">{region.name}</h2>
        <p>{cluster?.summary ?? region.description}</p>
      </div>

      {selectedTopic ? (
        <section className="topic-focus" aria-labelledby="topic-focus-title">
          <span>{selectedTopic.domain} · {selectedTopic.ageRangeStart}–{selectedTopic.ageRangeEnd} 歲</span>
          <h3 id="topic-focus-title">{selectedTopic.name}</h3>
          <p>{selectedTopic.description}</p>
          <strong>學會的證據</strong>
          <ul>{selectedTopic.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      ) : null}

      {topicNames.length > 0 ? (
        <div className="region-topics">
          <h3>這一站會長出的能力</h3>
          <ul>
            {topicNames.map((name) => <li key={name}>{name}</li>)}
          </ul>
        </div>
      ) : null}

      {mission ? (
        <div className="region-mission">
          <div>
            <strong>{mission.title}</strong>
            <span><Clock aria-hidden="true" /> 約 {mission.durationMinutes} 分鐘</span>
          </div>
          <span className="xp-label"><Sparkle aria-hidden="true" weight="fill" /> {mission.xp}</span>
        </div>
      ) : null}

      <button className="primary-button" type="button" disabled={locked || !mission} onClick={onStartMission}>
        {status === 'complete' ? '再探索一次' : status === 'available' ? '開始任務' : status === 'coming-soon' ? '準備中' : '尚未解鎖'}
        {locked ? <LockKey aria-hidden="true" /> : <Play aria-hidden="true" weight="fill" />}
      </button>
    </aside>
  );
}
