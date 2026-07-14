import {lazy, Suspense, useEffect, useState} from 'react';
import {CheckCircle, Graph, Path, SignIn, UserCircle} from '@phosphor-icons/react';
import {useAuth} from './features/auth/auth-context';
import {SubjectLearningPath} from './features/english/EnglishLearningPath';
import {ParentSkillMap} from './features/english/EnglishParentSkillMap';
import {LearningStudioHome} from './features/learning/LearningStudioHome';
import {LEARNING_SUBJECTS, learningStudios, type LearningSubject} from './features/learning/learningStudios';
import {ProfileDialog} from './features/profile/ProfileDialog';
import {useProgress} from './hooks/useProgress';
import {useFamily} from './hooks/useFamily';
import {dependencies, topics} from './lib/curriculum';
import {getPlaceValueLessonContent} from './lib/lessonContent';
import {getRecommendationForTopic, MASTERY_THRESHOLD} from './lib/mastery';

const EnglishWordLesson = lazy(() => import('./features/english/EnglishWordLesson').then((module) => ({default: module.EnglishWordLesson})));
const PlaceValueLesson = lazy(() => import('./features/lessons/PlaceValueLesson').then((module) => ({default: module.PlaceValueLesson})));
const ChineseZhuyinLesson = lazy(() => import('./features/chinese/ChineseZhuyinLesson').then((module) => ({default: module.ChineseZhuyinLesson})));

type Screen = 'home' | 'lesson' | 'growth' | 'parent';

export default function App() {
  const auth = useAuth();
  const family = useFamily(auth);
  const namespace = family.activeChild ? `child:${family.activeChild.id}` : 'guest';
  const {progress, syncStatus, retrySync, resolveSyncConflict, setChildAlias, completeEnglishWordLesson, completePlaceValueLesson, completeChineseZhuyinLesson} = useProgress(namespace, family.progressSync);
  const [profileOpen, setProfileOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [activeSubject, setActiveSubject] = useState<LearningSubject>('English');
  const studio = learningStudios[activeSubject];
  const profileLabel = family.activeChild?.alias
    ?? (auth.authenticated ? (family.profiles.length ? '管理孩子' : '建立孩子帳號')
      : family.profiles.length ? '孩子登入'
        : auth.canLogin ? '家長登入' : '小小學習者');
  const stateById = new Map(progress.topicStates.map((state) => [state.topicId, state]));
  const lessonState = stateById.get(studio.lessonTopicId)!;
  const masteredCount = studio.topicIds.filter((topicId) => (stateById.get(topicId)?.mastery ?? 0) >= MASTERY_THRESHOLD).length;
  const progressPercent = Math.round((masteredCount / studio.topicIds.length) * 100);
  const nextTopicId = studio.topicIds.find((topicId) => (stateById.get(topicId)?.mastery ?? 0) < MASTERY_THRESHOLD);
  const lessonReason = lessonState.mastery >= MASTERY_THRESHOLD
    ? studio.masteredReason
    : getRecommendationForTopic(studio.lessonTopicId, progress.topicStates, topics, dependencies).reason;
  const parentRecommendationReason = nextTopicId
    ? getRecommendationForTopic(nextTopicId, progress.topicStates, topics, dependencies).reason
    : studio.masteredReason;

  const skipTarget = screen === 'parent' ? '#parent-skill-graph'
    : screen === 'growth' ? '#growth-path'
      : screen === 'lesson' ? '#interactive-lesson'
        : '#today-lesson';

  useEffect(() => {
    setScreen('home');
  }, [family.activeChild?.id]);

  return (
    <div className={`app-shell english-focus-shell subject-${activeSubject.toLowerCase()}`}>
      <a className="skip-link" href={skipTarget}>跳到主要內容</a>
      {screen !== 'lesson' ? (
        <header className="topbar english-topbar">
          <button className="brand-lockup brand-button english-brand" type="button" onClick={() => setScreen('home')} aria-label={`回到今天的${studio.label}課`}>
            <span className="english-brand-mark" aria-hidden="true">{studio.mark}</span>
            <div><strong>Oshiami</strong><span>{studio.studioLabel}</span></div>
          </button>

          <nav className="studio-subject-switcher" aria-label="選擇學科">
            {LEARNING_SUBJECTS.map((subject) => (
              <button key={subject} type="button" aria-pressed={activeSubject === subject} onClick={() => setActiveSubject(subject)}>
                {learningStudios[subject].label}
              </button>
            ))}
          </nav>

          {screen === 'parent' ? (
            <div className="topbar-context">家長視角 · {studio.label}能力路徑</div>
          ) : (
            <div className="topbar-progress" aria-label={`${studio.label}掌握 ${progressPercent}%`}>
              <div><span>{studio.label}起步能力</span><strong>{masteredCount}／{studio.topicIds.length}</strong></div>
              <div className="progress-track" aria-hidden="true"><span style={{width: `${progressPercent}%`}} /></div>
            </div>
          )}

          <div className="topbar-actions">
            <button className="view-toggle-button" type="button" aria-label={screen === 'growth' ? '回到今天' : '我的成長'} aria-pressed={screen === 'growth'} onClick={() => setScreen(screen === 'growth' ? 'home' : 'growth')}>
              <Path aria-hidden="true" /> <span>{screen === 'growth' ? '回到今天' : '我的成長'}</span>
            </button>
            <button className="view-toggle-button" type="button" aria-label={screen === 'parent' ? '孩子首頁' : '家長技能圖'} aria-pressed={screen === 'parent'} onClick={() => setScreen(screen === 'parent' ? 'home' : 'parent')}>
              <Graph aria-hidden="true" /> <span>{screen === 'parent' ? '孩子首頁' : '家長技能圖'}</span>
            </button>
            <button
              className="profile-button"
              type="button"
              data-sync-status={family.activeChild ? syncStatus : undefined}
              aria-label={family.activeChild ? `孩子帳號：${family.activeChild.alias}，${syncStatus}` : profileLabel}
              onClick={() => setProfileOpen(true)}
            >
              {family.activeChild || auth.authenticated ? <UserCircle aria-hidden="true" weight="duotone" /> : <SignIn aria-hidden="true" />}
              <span>{profileLabel}</span>
              {family.activeChild ? <CheckCircle aria-label="孩子已登入" weight="fill" /> : auth.authenticated ? <CheckCircle aria-label="家長已登入" weight="fill" /> : null}
            </button>
          </div>
        </header>
      ) : null}

      {screen === 'home' ? (
        <LearningStudioHome studio={studio} lessonState={lessonState} recommendationReason={lessonReason} onStartLesson={() => setScreen('lesson')} onShowGrowth={() => setScreen('growth')} />
      ) : null}

      {screen === 'lesson' ? (
        <Suspense fallback={<div className="english-lesson-loading" role="status">正在準備{studio.label}互動課…</div>}>
          {activeSubject === 'English' ? <EnglishWordLesson onBack={() => setScreen('home')} onComplete={completeEnglishWordLesson} /> : null}
          {activeSubject === 'Mathematics' ? (
            <PlaceValueLesson
              onBack={() => setScreen('home')}
              onComplete={completePlaceValueLesson}
              content={getPlaceValueLessonContent(progress.curriculumFramework)}
              locale={progress.curriculumFramework === 'cn-2022-math' ? 'zh-CN' : 'zh-TW'}
            />
          ) : null}
          {activeSubject === 'Chinese' ? <ChineseZhuyinLesson onBack={() => setScreen('home')} onComplete={completeChineseZhuyinLesson} /> : null}
        </Suspense>
      ) : null}

      {screen === 'growth' ? (
        <main id="growth-path" className="english-growth-page">
          <SubjectLearningPath states={progress.topicStates} studio={studio} onStartLesson={() => setScreen('lesson')} />
        </main>
      ) : null}

      {screen === 'parent' ? (
        <ParentSkillMap states={progress.topicStates} studio={studio} recommendationReason={parentRecommendationReason} onStartLesson={() => setScreen('lesson')} />
      ) : null}

      <div className="sr-only" aria-live="polite">{lessonReason}</div>
      <ProfileDialog
        open={profileOpen}
        auth={auth}
        family={family}
        guestAlias={progress.childAlias}
        syncStatus={syncStatus}
        onRetrySync={retrySync}
        onResolveSyncConflict={resolveSyncConflict}
        onClose={() => setProfileOpen(false)}
        onSaveGuestAlias={setChildAlias}
        onChildActivated={() => setScreen('home')}
      />
    </div>
  );
}
