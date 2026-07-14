import {lazy, Suspense, useState} from 'react';
import {CheckCircle, Graph, Path, SignIn, UserCircle} from '@phosphor-icons/react';
import {useAuth} from './features/auth/auth-context';
import {SubjectLearningPath} from './features/english/EnglishLearningPath';
import {ParentSkillMap} from './features/english/EnglishParentSkillMap';
import {getEnglishCourseSelection, getEnglishScenarioForTopic} from './features/english/englishCourse';
import {LearningStudioHome} from './features/learning/LearningStudioHome';
import {getLearningStudio, LEARNING_SUBJECTS, learningStudios, type LearningSubject} from './features/learning/learningStudios';
import {ProfileDialog} from './features/profile/ProfileDialog';
import {useProgress} from './hooks/useProgress';
import {dependencies, topics} from './lib/curriculum';
import {getPlaceValueLessonContent} from './lib/lessonContent';
import {getRecommendationForTopic, MASTERY_THRESHOLD} from './lib/mastery';

const EnglishWordLesson = lazy(() => import('./features/english/EnglishWordLesson').then((module) => ({default: module.EnglishWordLesson})));
const EnglishSpeakingLesson = lazy(() => import('./features/english/EnglishSpeakingLesson').then((module) => ({default: module.EnglishSpeakingLesson})));
const EnglishCardLesson = lazy(() => import('./features/english/EnglishCardLesson').then((module) => ({default: module.EnglishCardLesson})));
const PlaceValueLesson = lazy(() => import('./features/lessons/PlaceValueLesson').then((module) => ({default: module.PlaceValueLesson})));
const ChineseZhuyinLesson = lazy(() => import('./features/chinese/ChineseZhuyinLesson').then((module) => ({default: module.ChineseZhuyinLesson})));

type Screen = 'home' | 'lesson' | 'growth' | 'parent';

export default function App() {
  const auth = useAuth();
  const namespace = auth.userId ? `privy:${auth.userId}` : 'guest';
  const {progress, setChildAlias, completeEnglishWordLesson, completeEnglishSpeakingLesson, completeEnglishCardLesson, completePlaceValueLesson, completeChineseZhuyinLesson} = useProgress(namespace);
  const [profileOpen, setProfileOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [activeSubject, setActiveSubject] = useState<LearningSubject>('English');
  const [lessonTopicId, setLessonTopicId] = useState<string | null>(null);
  const studio = getLearningStudio(activeSubject, progress.topicStates);
  const englishSelection = activeSubject === 'English' ? getEnglishCourseSelection(progress.topicStates) : null;
  const stateById = new Map(progress.topicStates.map((state) => [state.topicId, state]));
  const lessonState = stateById.get(studio.lessonTopicId)!;
  const masteredCount = studio.topicIds.filter((topicId) => (stateById.get(topicId)?.mastery ?? 0) >= MASTERY_THRESHOLD).length;
  const progressPercent = Math.round((masteredCount / studio.topicIds.length) * 100);
  const nextTopicId = studio.topicIds.find((topicId) => (stateById.get(topicId)?.mastery ?? 0) < MASTERY_THRESHOLD);
  const lessonReason = englishSelection?.reason ?? (lessonState.mastery >= MASTERY_THRESHOLD
    ? studio.masteredReason
    : getRecommendationForTopic(studio.lessonTopicId, progress.topicStates, topics, dependencies).reason);
  const parentRecommendationReason = englishSelection?.reason ?? (nextTopicId
    ? getRecommendationForTopic(nextTopicId, progress.topicStates, topics, dependencies).reason
    : studio.masteredReason);
  const activeLessonScenario = activeSubject === 'English' && lessonTopicId
    ? getEnglishScenarioForTopic(lessonTopicId)
    : null;
  const startLesson = () => {
    setLessonTopicId(studio.lessonTopicId);
    setScreen('lesson');
  };
  const leaveLesson = () => {
    setLessonTopicId(null);
    setScreen('home');
  };

  const skipTarget = screen === 'parent' ? '#parent-skill-graph'
    : screen === 'growth' ? '#growth-path'
      : screen === 'lesson' ? '#interactive-lesson'
        : '#today-lesson';

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
            <button className="profile-button" type="button" aria-label={progress.childAlias ? `孩子資料：${progress.childAlias}` : '孩子資料與家長登入'} onClick={() => setProfileOpen(true)}>
              <UserCircle aria-hidden="true" weight="duotone" />
              <span>{progress.childAlias || (auth.authenticated ? '建立孩子暱稱' : '小小學習者')}</span>
              {auth.authenticated ? <CheckCircle aria-label="家長已登入" weight="fill" /> : <SignIn aria-label="訪客模式" />}
            </button>
          </div>
        </header>
      ) : null}

      {screen === 'home' ? (
        <LearningStudioHome studio={studio} lessonState={lessonState} recommendationReason={lessonReason} onStartLesson={startLesson} onShowGrowth={() => setScreen('growth')} />
      ) : null}

      {screen === 'lesson' ? (
        <Suspense fallback={<div className="english-lesson-loading" role="status">正在準備{studio.label}互動課…</div>}>
          {activeSubject === 'English' && activeLessonScenario?.kind === 'word'
            ? <EnglishWordLesson onBack={leaveLesson} onComplete={completeEnglishWordLesson} />
            : null}
          {activeSubject === 'English' && activeLessonScenario?.kind === 'speaking'
            ? <EnglishSpeakingLesson onBack={leaveLesson} onComplete={completeEnglishSpeakingLesson} />
            : null}
          {activeSubject === 'English' && activeLessonScenario?.kind === 'card'
            ? <EnglishCardLesson scenario={activeLessonScenario} onBack={leaveLesson} onComplete={(summary) => completeEnglishCardLesson(activeLessonScenario, summary)} />
            : null}
          {activeSubject === 'Mathematics' ? (
            <PlaceValueLesson
              onBack={leaveLesson}
              onComplete={completePlaceValueLesson}
              content={getPlaceValueLessonContent(progress.curriculumFramework)}
              locale={progress.curriculumFramework === 'cn-2022-math' ? 'zh-CN' : 'zh-TW'}
            />
          ) : null}
          {activeSubject === 'Chinese' ? <ChineseZhuyinLesson onBack={leaveLesson} onComplete={completeChineseZhuyinLesson} /> : null}
        </Suspense>
      ) : null}

      {screen === 'growth' ? (
        <main id="growth-path" className="english-growth-page">
          <SubjectLearningPath states={progress.topicStates} studio={studio} onStartLesson={startLesson} />
        </main>
      ) : null}

      {screen === 'parent' ? (
        <ParentSkillMap states={progress.topicStates} studio={studio} recommendationReason={parentRecommendationReason} onStartLesson={startLesson} />
      ) : null}

      <div className="sr-only" aria-live="polite">{lessonReason}</div>
      <ProfileDialog open={profileOpen} auth={auth} childAlias={progress.childAlias} onClose={() => setProfileOpen(false)} onSaveAlias={setChildAlias} />
    </div>
  );
}
