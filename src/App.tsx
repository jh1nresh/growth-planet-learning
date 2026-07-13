import {lazy, Suspense, useMemo, useRef, useState} from 'react';
import {
  ArrowRight,
  BookOpenText,
  Calculator,
  ChartLineUp,
  CheckCircle,
  Compass,
  Graph,
  Planet,
  SignIn,
  Sparkle,
  Translate,
  UserCircle,
} from '@phosphor-icons/react';
import {useAuth} from './features/auth/auth-context';
import {MissionDialog} from './features/missions/MissionDialog';
import {ProfileDialog} from './features/profile/ProfileDialog';
import {RegionPanel} from './features/world/RegionPanel';
import {WorldControls} from './features/world/WorldControls';
import type {PlanetControlsHandle} from './features/world/PlanetScene';
import {useProgress} from './hooks/useProgress';
import {clusterById, dependencies, getRegionStatus, getSubjectRegions, missionByRegionId, missions, regions, topics} from './lib/curriculum';
import {getRecommendation, MASTERY_THRESHOLD} from './lib/mastery';
import {getLessonContentProfile, getMissionContent, getPlaceValueLessonContent, getRegionContent, getTopicContent, localizeRecommendationReason} from './lib/lessonContent';
import type {Subject, WorldRegion} from './types';

const PlanetScene = lazy(() => import('./features/world/PlanetScene').then((module) => ({default: module.PlanetScene})));
const MarbleTaxonomyExplorer = lazy(() => import('./features/world/MarbleTaxonomyExplorer').then((module) => ({default: module.MarbleTaxonomyExplorer})));
const PlaceValueLesson = lazy(() => import('./features/lessons/PlaceValueLesson').then((module) => ({default: module.PlaceValueLesson})));
type Screen = 'home' | 'lesson' | 'growth' | 'parent';

const topicVisuals: Record<string, string> = {
  tw_math_g1_count_20: '1 → 20',
  tw_math_g1_count_100: '10 → 100',
  tw_math_g1_zero_placeholder: '50',
  tw_math_g1_compare_two_digit: '42 > 24',
  tw_math_g1_number_bonds_10: '6 + 4',
  tw_math_g1_add_20: '8 + 7',
  tw_math_g1_subtract_20: '15 − 6',
  tw_math_g1_shapes_2d: '○ △ □',
  tw_math_g1_shapes_3d: '立體',
  tw_math_g1_length_compare: '長 ↔ 短',
  tw_math_g1_time_hour: '3:30',
  tw_math_g1_mixed_review: '想・做・查',
  tw_eng_g1_letter_sounds: 'A → /a/',
  tw_eng_g1_sight_words: 'I・you・the',
  tw_eng_g1_greetings: 'Hello!',
};

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
  const {progress, setChildAlias, setCurriculumFramework, completeMission, completePlaceValueLesson} = useProgress(namespace);
  const completedMissionIds = useMemo(() => new Set(progress.completedMissionIds), [progress.completedMissionIds]);
  const [activeSubject, setActiveSubject] = useState<Subject>('Mathematics');
  const [selectedRegionId, setSelectedRegionId] = useState('counting_harbor');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>('tw_math_g1_count_20');
  const [missionOpen, setMissionOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const controlsRef = useRef<PlanetControlsHandle>(null);
  const activeContentFramework = activeSubject === 'Mathematics' ? progress.curriculumFramework : 'tw-108-math';

  const localizedRegions = useMemo(
    () => regions.map((region) => getRegionContent(progress.curriculumFramework, region)),
    [progress.curriculumFramework],
  );
  const selectedRegion = localizedRegions.find((region) => region.id === selectedRegionId) ?? localizedRegions.find((region) => region.subject === 'Mathematics')!;
  const canonicalSelectedMission = missionByRegionId.get(selectedRegion.id) ?? null;
  const selectedMission = canonicalSelectedMission ? getMissionContent(activeContentFramework, canonicalSelectedMission) : null;
  const lessonProfile = getLessonContentProfile(activeContentFramework);
  const localizedTopics = useMemo(
    () => topics.map((topic) => getTopicContent(progress.curriculumFramework, topic)),
    [progress.curriculumFramework],
  );
  const localizedTopicById = useMemo(() => new Map(localizedTopics.map((topic) => [topic.id, topic])), [localizedTopics]);
  const selectedStatus = getRegionStatus(selectedRegion, completedMissionIds);
  const activeRegions = localizedRegions.filter((region) => region.subject === activeSubject).sort((left, right) => left.order - right.order);
  const activeTopics = localizedTopics.filter((topic) => topic.subject === activeSubject);
  const masteredActive = activeTopics.filter((topic) => (progress.topicStates.find((state) => state.topicId === topic.id)?.mastery ?? 0) >= MASTERY_THRESHOLD).length;
  const progressPercent = activeTopics.length ? Math.round((masteredActive / activeTopics.length) * 100) : 0;
  const recommendation = useMemo(
    () => getRecommendation(activeSubject, progress.topicStates, localizedTopics, dependencies),
    [activeSubject, localizedTopics, progress.topicStates],
  );
  const recommendationReason = localizeRecommendationReason(activeContentFramework, recommendation.reason);
  const recommendedState = progress.topicStates.find((state) => state.topicId === recommendation.topic.id);
  const recommendedMission = missions.find((mission) => mission.topicIds.includes(recommendation.topic.id));
  const interactiveRecommendation = recommendation.topic.id === 'tw_math_g1_bundle_ten'
    || recommendation.topic.id === 'tw_math_g1_tens_ones';
  const recommendationVisual = recommendation.topic.id === 'tw_math_g1_coin_values'
    ? (lessonProfile.currency === 'CNY' ? '¥ 50' : 'NT$ 50')
    : topicVisuals[recommendation.topic.id] ?? recommendation.topic.name;

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

  const startRecommended = () => {
    if (interactiveRecommendation) {
      setScreen('lesson');
      return;
    }
    if (!recommendedMission) return;
    const region = localizedRegions.find((item) => item.id === recommendedMission.regionId);
    if (region) chooseRegion(region);
    setMissionOpen(true);
  };

  const skipTarget = screen === 'parent' ? '#parent-skill-graph'
    : screen === 'growth' ? '#region-navigation'
      : screen === 'lesson' ? '#interactive-lesson'
        : '#today-lesson';

  return (
    <div className={screen === 'parent' ? 'app-shell parent-graph-shell' : 'app-shell'}>
      <a className="skip-link" href={skipTarget}>跳到主要內容</a>
      <header className="topbar lesson-first-topbar">
        <button className="brand-lockup brand-button" type="button" onClick={() => setScreen('home')} aria-label="回到今天的學習">
          <Planet aria-hidden="true" weight="duotone" />
          <div>
            <strong>成長星球</strong>
            <span>一次學會一件事</span>
          </div>
        </button>

        {screen !== 'parent' ? (
          <div className="topbar-progress" aria-label={`${activeSubject === 'Mathematics' ? '數學' : '英文'}掌握 ${progressPercent}%`}>
            <div>
              <span>{activeSubject === 'Mathematics' ? '數學能力' : '英文能力'}</span>
              <strong>{masteredActive}／{activeTopics.length}</strong>
            </div>
            <div className="progress-track" aria-hidden="true"><span style={{width: `${progressPercent}%`}} /></div>
          </div>
        ) : <div className="topbar-context">家長視角 · 課程全貌</div>}

        <div className="topbar-actions">
          <button className="view-toggle-button" type="button" aria-pressed={screen === 'growth'} onClick={() => setScreen(screen === 'growth' ? 'home' : 'growth')}>
            <Planet aria-hidden="true" /> {screen === 'growth' ? '回到今天' : '我的成長'}
          </button>
          <button className="view-toggle-button" type="button" aria-pressed={screen === 'parent'} onClick={() => setScreen(screen === 'parent' ? 'home' : 'parent')}>
            <Graph aria-hidden="true" /> {screen === 'parent' ? '孩子首頁' : '家長技能圖'}
          </button>
          <button className="profile-button" type="button" onClick={() => setProfileOpen(true)}>
            <UserCircle aria-hidden="true" weight="duotone" />
            <span>{progress.childAlias || (auth.authenticated ? '建立孩子暱稱' : '小小學習者')}</span>
            {auth.authenticated ? <CheckCircle aria-label="家長已登入" weight="fill" /> : <SignIn aria-label="訪客模式" />}
          </button>
        </div>
      </header>

      {screen === 'parent' ? (
        <main id="parent-skill-graph" className="parent-graph-stage">
          <aside className="parent-progress-overlay" aria-label="孩子掌握摘要">
            <span>孩子目前的{activeSubject === 'Mathematics' ? '數學' : '英文'}路徑</span>
            <strong>{masteredActive}／{activeTopics.length} 個能力已掌握</strong>
            <p>{recommendationReason}</p>
          </aside>
          <Suspense fallback={<div className="taxonomy-loading" role="status">正在連接學習關係…</div>}>
            <MarbleTaxonomyExplorer />
          </Suspense>
        </main>
      ) : null}

      {screen === 'home' ? (
        <main id="today-lesson" className="lesson-home">
          <div className="lesson-toolbar">
            <nav className="subject-switcher lesson-subject-switcher" aria-label="選擇學科">
              <button className={activeSubject === 'Mathematics' ? 'is-active' : ''} type="button" onClick={() => chooseSubject('Mathematics')}>
                <Calculator aria-hidden="true" weight="duotone" /> <span>數學</span>
              </button>
              <button className={activeSubject === 'English' ? 'is-active' : ''} type="button" onClick={() => chooseSubject('English')}>
                <Translate aria-hidden="true" weight="duotone" /> <span>英文</span>
              </button>
            </nav>
            {activeSubject === 'Mathematics' ? (
              <div className="curriculum-switcher" role="group" aria-label="選擇數學教材版本">
                <span>教材版本</span>
                <button type="button" aria-pressed={progress.curriculumFramework === 'tw-108-math'} onClick={() => setCurriculumFramework('tw-108-math')}>台灣繁中</button>
                <button type="button" aria-pressed={progress.curriculumFramework === 'cn-2022-math'} onClick={() => setCurriculumFramework('cn-2022-math')}>中國簡中（人教）</button>
              </div>
            ) : null}
          </div>

          <section className="today-lesson-card" lang={lessonProfile.locale}>
            <div className="today-lesson-copy">
              <span className="lesson-eyebrow"><Sparkle aria-hidden="true" weight="fill" /> 今天的學習</span>
              <span className="lesson-content-profile">{lessonProfile.publisherProfile}</span>
              <p className="lesson-domain">{recommendation.topic.domain}</p>
              <h1>{recommendation.topic.name}</h1>
              <p className="lesson-description">{recommendation.topic.description}</p>
              <div className="recommendation-reason">
                <span className="tutor-avatar" aria-hidden="true">芽</span>
                <div><strong>芽芽為什麼推薦這一課</strong><p>{recommendationReason}</p></div>
              </div>
              <button className="today-primary-button" type="button" onClick={startRecommended} disabled={!recommendedMission && !interactiveRecommendation}>
                {recommendedState && recommendedState.attempts > 0 ? '繼續學習' : '開始今天這一課'} <ArrowRight aria-hidden="true" weight="bold" />
              </button>
            </div>
            <div className="today-lesson-visual" aria-hidden="true">
              {interactiveRecommendation ? (
                <div className="place-value-preview"><span>10</span><span>10</span><span>10</span><i>1</i><i>1</i><i>1</i><i>1</i></div>
              ) : null}
              <strong>{interactiveRecommendation ? '34' : recommendationVisual}</strong>
              <span>{interactiveRecommendation ? '3 個十・4 個一' : '一次只學一件事'}</span>
            </div>
          </section>

          <aside className="learning-snapshot">
            <div className="snapshot-heading"><ChartLineUp aria-hidden="true" /><span>我的學習狀態</span></div>
            <strong>{progressPercent}%</strong>
            <p>{activeSubject === 'Mathematics' ? `${masteredActive} 個數學能力已經站穩。` : `${masteredActive} 個英文能力已經站穩。`}</p>
            <dl>
              <div><dt>這一課練習</dt><dd>{recommendation.topic.evidence[0]}</dd></div>
              <div><dt>目前嘗試</dt><dd>{recommendedState?.attempts ?? 0} 次</dd></div>
            </dl>
            <button type="button" onClick={() => setScreen('growth')}><Compass aria-hidden="true" /> 查看完整學習路徑</button>
          </aside>
        </main>
      ) : null}

      {screen === 'lesson' ? (
        <Suspense fallback={<div className="lesson-loading" role="status">正在準備位值積木…</div>}>
          <PlaceValueLesson
            onBack={() => setScreen('home')}
            onComplete={completePlaceValueLesson}
            content={getPlaceValueLessonContent(activeContentFramework)}
            locale={lessonProfile.locale}
          />
        </Suspense>
      ) : null}

      {screen === 'growth' ? (
        <main className="world-layout">
          <nav className="subject-switcher" aria-label="選擇學習大陸">
            <button className={activeSubject === 'Mathematics' ? 'is-active' : ''} type="button" onClick={() => chooseSubject('Mathematics')}>
              <Calculator aria-hidden="true" weight="duotone" /><span>數學大陸</span>
            </button>
            <button className={activeSubject === 'English' ? 'is-active' : ''} type="button" onClick={() => chooseSubject('English')}>
              <Translate aria-hidden="true" weight="duotone" /><span>英文港口</span>
            </button>
          </nav>

          <section className="world-stage" aria-label="可旋轉的 3D 成長星球">
            <div className="world-story-card"><span>我的成長</span><strong>已掌握的能力會在這裡發光</strong><p>這是進度總覽；回到今天的學習，可以直接繼續下一課。</p></div>
            <Suspense fallback={<PlanetLoading />}>
              <PlanetScene
                ref={controlsRef}
                activeSubject={activeSubject}
                completedMissionIds={completedMissionIds}
                regions={localizedRegions}
                selectedRegionId={selectedRegionId}
                onSelectRegion={(regionId) => {
                  const region = localizedRegions.find((item) => item.id === regionId);
                  if (region) chooseRegion(region);
                }}
              />
            </Suspense>
            <WorldControls controls={controlsRef} />
          </section>

          <nav id="region-navigation" className="region-navigation" aria-label={`${activeSubject === 'Mathematics' ? '數學大陸' : '英文港口'}地標`}>
            <div className="region-navigation-title"><BookOpenText aria-hidden="true" /><span>完整學習路徑</span></div>
            <ol>
              {activeRegions.map((region) => {
                const status = getRegionStatus(region, completedMissionIds);
                return (
                  <li key={region.id}>
                    <button className={`${selectedRegionId === region.id ? 'is-selected' : ''} region-nav-${status}`} type="button" onClick={() => chooseRegion(region)} aria-current={selectedRegionId === region.id ? 'step' : undefined}>
                      <span className="region-nav-order">{status === 'complete' ? <CheckCircle aria-hidden="true" weight="fill" /> : region.order}</span>
                      <span><strong>{region.name}</strong><small>{region.description}</small></span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <a className="taxonomy-credit" href="https://github.com/withmarbleapp/os-taxonomy" target="_blank" rel="noreferrer">Curriculum graph informed by Marble Skill Taxonomy v1</a>
          </nav>

          <RegionPanel
            region={selectedRegion}
            selectedTopicId={selectedTopicId}
            status={selectedStatus}
            mission={selectedMission}
            topicContentById={localizedTopicById}
            onStartMission={() => {
              if (selectedRegion.id === 'bundle_bridge' || selectedRegion.id === 'place_value_tower') setScreen('lesson');
              else setMissionOpen(true);
            }}
          />
        </main>
      ) : null}

      <div className="sr-only" aria-live="polite">{recommendationReason}</div>
      <MissionDialog mission={selectedMission} open={missionOpen} alreadyComplete={selectedMission ? completedMissionIds.has(selectedMission.id) : false} locale={lessonProfile.locale} onClose={() => setMissionOpen(false)} onComplete={completeMission} />
      <ProfileDialog open={profileOpen} auth={auth} childAlias={progress.childAlias} onClose={() => setProfileOpen(false)} onSaveAlias={setChildAlias} />
    </div>
  );
}
