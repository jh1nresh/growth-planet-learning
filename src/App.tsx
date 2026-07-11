import {lazy, Suspense, useMemo, useRef, useState} from 'react';
import {
  BookOpenText,
  Calculator,
  CheckCircle,
  Compass,
  Planet,
  SignIn,
  Translate,
  UserCircle,
} from '@phosphor-icons/react';
import {useAuth} from './features/auth/auth-context';
import {MissionDialog} from './features/missions/MissionDialog';
import {ProfileDialog} from './features/profile/ProfileDialog';
import {RegionPanel} from './features/world/RegionPanel';
import {SkillConstellation} from './features/world/SkillConstellation';
import {WorldControls} from './features/world/WorldControls';
import type {PlanetControlsHandle} from './features/world/PlanetScene';
import {useProgress} from './hooks/useProgress';
import {clusterById, getRegionStatus, getSubjectRegions, missionByRegionId, missions, regions, topics} from './lib/curriculum';
import type {Subject, WorldRegion} from './types';

const PlanetScene = lazy(() => import('./features/world/PlanetScene').then((module) => ({default: module.PlanetScene})));
const useExperimentalPlanet = new URLSearchParams(window.location.search).get('view') === 'planet';
const mathRegions = getSubjectRegions('Mathematics');
const englishRegions = getSubjectRegions('English');
const playableMathMissionIds = new Set(missions.filter((mission) => mathRegions.some((region) => region.id === mission.regionId)).map((mission) => mission.id));
const playableEnglishMissionIds = new Set(missions.filter((mission) => englishRegions.some((region) => region.id === mission.regionId)).map((mission) => mission.id));

function PlanetLoading() {
  return (
    <div className="planet-loading" role="status">
      <div className="planet-loading-art" aria-hidden="true" />
      <span>正在組裝 3D 成長星球…</span>
    </div>
  );
}

export default function App() {
  const auth = useAuth();
  const namespace = auth.userId ? `privy:${auth.userId}` : 'guest';
  const {progress, setChildAlias, completeMission} = useProgress(namespace);
  const completedMissionIds = useMemo(() => new Set(progress.completedMissionIds), [progress.completedMissionIds]);
  const [activeSubject, setActiveSubject] = useState<Subject>('Mathematics');
  const [selectedRegionId, setSelectedRegionId] = useState('counting_harbor');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>('tw_math_g1_count_20');
  const [missionOpen, setMissionOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const controlsRef = useRef<PlanetControlsHandle>(null);

  const selectedRegion = regions.find((region) => region.id === selectedRegionId) ?? mathRegions[0];
  const selectedMission = missionByRegionId.get(selectedRegion.id) ?? null;
  const selectedStatus = getRegionStatus(selectedRegion, completedMissionIds);
  const activeMissionIds = activeSubject === 'Mathematics' ? playableMathMissionIds : playableEnglishMissionIds;
  const completedActive = [...activeMissionIds].filter((id) => completedMissionIds.has(id)).length;
  const progressPercent = Math.round((completedActive / activeMissionIds.size) * 100);
  const activeRegions = activeSubject === 'Mathematics' ? mathRegions : englishRegions;

  const chooseSubject = (subject: Subject) => {
    setActiveSubject(subject);
    const first = getSubjectRegions(subject)[0];
    if (first) setSelectedRegionId(first.id);
    setSelectedTopicId(topics.find((topic) => topic.subject === subject)?.id ?? null);
  };

  const chooseRegion = (region: WorldRegion) => {
    if (region.subject === 'Mathematics' || region.subject === 'English') setActiveSubject(region.subject);
    setSelectedRegionId(region.id);
    const cluster = region.clusterId ? clusterById.get(region.clusterId) : undefined;
    setSelectedTopicId(cluster?.topicIds[0] ?? null);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#region-navigation">跳到學習地標</a>
      <header className="topbar">
        <div className="brand-lockup">
          <Planet aria-hidden="true" weight="duotone" />
          <div>
            <strong>成長星球</strong>
            <span>每學會一件事，世界就亮一點</span>
          </div>
        </div>

        <div className="topbar-progress" aria-label={`${activeSubject === 'Mathematics' ? '數學星系' : '英文星系'}完成 ${progressPercent}%`}>
          <div>
            <span>{activeSubject === 'Mathematics' ? '數學星系' : '英文星系'}</span>
            <strong>{completedActive}／{activeMissionIds.size}</strong>
          </div>
          <div className="progress-track" aria-hidden="true"><span style={{width: `${progressPercent}%`}} /></div>
        </div>

        <button className="profile-button" type="button" onClick={() => setProfileOpen(true)}>
          <UserCircle aria-hidden="true" weight="duotone" />
          <span>{progress.childAlias || (auth.authenticated ? '建立孩子暱稱' : '小小探險家')}</span>
          {auth.authenticated ? <CheckCircle aria-label="家長已登入" weight="fill" /> : <SignIn aria-label="訪客模式" />}
        </button>
      </header>

      <main className="world-layout">
        <nav className="subject-switcher" aria-label="選擇學習大陸">
          <button className={activeSubject === 'Mathematics' ? 'is-active' : ''} type="button" onClick={() => chooseSubject('Mathematics')}>
            <Calculator aria-hidden="true" weight="duotone" />
            <span>數學大陸</span>
          </button>
          <button className={activeSubject === 'English' ? 'is-active' : ''} type="button" onClick={() => chooseSubject('English')}>
            <Translate aria-hidden="true" weight="duotone" />
            <span>英文港口</span>
          </button>
        </nav>

        <section className="world-stage" aria-label={useExperimentalPlanet ? '可旋轉的 3D 成長星球' : '數學與英文技能星圖'}>
          <div className="sr-only">
            <span><Compass aria-hidden="true" /> {useExperimentalPlanet ? '實驗星球模式' : activeSubject === 'Mathematics' ? '數學技能星系' : '英文技能星系'}</span>
            <h1>{activeSubject === 'Mathematics' ? '沿著先修路徑點亮數學能力' : '從字母音走到第一句英文'}</h1>
            <p>{useExperimentalPlanet ? '拖曳星球找地標，完成任務後路線會一站一站亮起。' : '選擇科目，再點一顆能力星查看學習內容與學會的證據。'}</p>
          </div>

          {useExperimentalPlanet ? (
            <>
              <Suspense fallback={<PlanetLoading />}>
                <PlanetScene
                  ref={controlsRef}
                  activeSubject={activeSubject}
                  completedMissionIds={completedMissionIds}
                  regions={regions}
                  selectedRegionId={selectedRegionId}
                  onSelectRegion={(regionId) => {
                    const region = regions.find((item) => item.id === regionId);
                    if (region) chooseRegion(region);
                  }}
                />
              </Suspense>
              <WorldControls controls={controlsRef} />
            </>
          ) : (
            <SkillConstellation
              activeSubject={activeSubject}
              selectedTopicId={selectedTopicId}
              completedMissionIds={completedMissionIds}
              onChooseSubject={chooseSubject}
              onSelectTopic={(topicId, regionId) => {
                setSelectedTopicId(topicId);
                setSelectedRegionId(regionId);
              }}
            />
          )}
        </section>

        <nav id="region-navigation" className="region-navigation" aria-label={`${activeSubject === 'Mathematics' ? '數學大陸' : '英文港口'}地標`}>
          <div className="region-navigation-title">
            <BookOpenText aria-hidden="true" weight="duotone" />
            <span>學習路線</span>
          </div>
          <ol>
            {activeRegions.map((region) => {
              const status = getRegionStatus(region, completedMissionIds);
              return (
                <li key={region.id}>
                  <button
                    className={`${selectedRegionId === region.id ? 'is-selected' : ''} region-nav-${status}`}
                    type="button"
                    onClick={() => chooseRegion(region)}
                    aria-current={selectedRegionId === region.id ? 'step' : undefined}
                  >
                    <span className="region-nav-order">{status === 'complete' ? <CheckCircle aria-hidden="true" weight="fill" /> : region.order}</span>
                    <span><strong>{region.name}</strong><small>{region.description}</small></span>
                  </button>
                </li>
              );
            })}
          </ol>
          <a className="taxonomy-credit" href="https://github.com/withmarbleapp/os-taxonomy" target="_blank" rel="noreferrer">
            Curriculum graph architecture informed by Marble Skill Taxonomy v1
          </a>
        </nav>

        <RegionPanel
          region={selectedRegion}
          selectedTopicId={selectedTopicId}
          status={selectedStatus}
          onStartMission={() => setMissionOpen(true)}
        />
      </main>

      <div className="sr-only" aria-live="polite">
        {selectedRegion.name}，{selectedStatus === 'complete' ? '已完成' : selectedStatus === 'available' ? '可以探索' : '尚未解鎖'}。
      </div>

      <MissionDialog
        mission={selectedMission}
        open={missionOpen}
        alreadyComplete={selectedMission ? completedMissionIds.has(selectedMission.id) : false}
        onClose={() => setMissionOpen(false)}
        onComplete={completeMission}
      />
      <ProfileDialog
        open={profileOpen}
        auth={auth}
        childAlias={progress.childAlias}
        onClose={() => setProfileOpen(false)}
        onSaveAlias={setChildAlias}
      />
    </div>
  );
}
