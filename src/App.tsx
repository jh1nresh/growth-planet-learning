import {lazy, Suspense, useState} from 'react';
import {ArrowRight, CheckCircle, Graph, Path, SignIn, UserCircle} from '@phosphor-icons/react';
import {useAuth} from './features/auth/auth-context';
import {CatIllustration} from './features/english/CatIllustration';
import {EnglishLearningPath} from './features/english/EnglishLearningPath';
import {EnglishParentSkillMap} from './features/english/EnglishParentSkillMap';
import {ENGLISH_WORD_TOPIC_ID} from './features/english/englishWordLessonState';
import {ProfileDialog} from './features/profile/ProfileDialog';
import {useProgress} from './hooks/useProgress';
import {dependencies, topics} from './lib/curriculum';
import {getRecommendation, getRecommendationForTopic, MASTERY_THRESHOLD} from './lib/mastery';

const EnglishWordLesson = lazy(() => import('./features/english/EnglishWordLesson').then((module) => ({default: module.EnglishWordLesson})));
const englishTopics = topics.filter((topic) => topic.subject === 'English');

type Screen = 'home' | 'lesson' | 'growth' | 'parent';

export default function App() {
  const auth = useAuth();
  const namespace = auth.userId ? `privy:${auth.userId}` : 'guest';
  const {progress, setChildAlias, completeEnglishWordLesson} = useProgress(namespace);
  const [profileOpen, setProfileOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');

  const masteredEnglish = englishTopics.filter((topic) => (
    progress.topicStates.find((state) => state.topicId === topic.id)?.mastery ?? 0
  ) >= MASTERY_THRESHOLD).length;
  const progressPercent = Math.round((masteredEnglish / englishTopics.length) * 100);
  const lessonRecommendation = getRecommendationForTopic(ENGLISH_WORD_TOPIC_ID, progress.topicStates, topics, dependencies);
  const pathRecommendation = getRecommendation('English', progress.topicStates, topics, dependencies);
  const lessonState = progress.topicStates.find((state) => state.topicId === ENGLISH_WORD_TOPIC_ID)!;
  const lessonMastered = lessonState.mastery >= MASTERY_THRESHOLD;
  const lessonReason = lessonMastered
    ? '你已經把 C、A、T 和聲音接起來了；今天用一輪短複習，讓它變得更穩。'
    : lessonRecommendation.reason;
  const parentRecommendationReason = lessonMastered && pathRecommendation.topic.id === 'tw_eng_g1_sight_words'
    ? '「字母與起始音」已經站穩，下一步練「第一批常見字」，把聲音連到常用單字。'
    : pathRecommendation.reason;

  const skipTarget = screen === 'parent' ? '#parent-skill-graph'
    : screen === 'growth' ? '#growth-path'
      : screen === 'lesson' ? '#interactive-lesson'
        : '#today-lesson';

  return (
    <div className="app-shell english-focus-shell">
      <a className="skip-link" href={skipTarget}>跳到主要內容</a>
      <header className="topbar english-topbar">
        <button className="brand-lockup brand-button english-brand" type="button" onClick={() => setScreen('home')} aria-label="回到今天的英文課">
          <span className="english-brand-mark" aria-hidden="true">A</span>
          <div>
            <strong>成長星球</strong>
            <span>English Studio</span>
          </div>
        </button>

        {screen === 'parent' ? (
          <div className="topbar-context">家長視角 · 英文能力路徑</div>
        ) : (
          <div className="topbar-progress" aria-label={`英文掌握 ${progressPercent}%`}>
            <div><span>英文能力</span><strong>{masteredEnglish}／{englishTopics.length}</strong></div>
            <div className="progress-track" aria-hidden="true"><span style={{width: `${progressPercent}%`}} /></div>
          </div>
        )}

        <div className="topbar-actions">
          <button className="view-toggle-button" type="button" aria-pressed={screen === 'growth'} onClick={() => setScreen(screen === 'growth' ? 'home' : 'growth')}>
            <Path aria-hidden="true" /> {screen === 'growth' ? '回到今天' : '我的成長'}
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

      {screen === 'home' ? (
        <main id="today-lesson" className="english-home">
          <section className="english-hero" aria-labelledby="today-english-title">
            <div className="english-hero-copy">
              <span className="english-eyebrow">今日英文 · 約 4 分鐘</span>
              <p className="english-domain">PHONICS · 字母與起始音</p>
              <h1 id="today-english-title">聽一聽，<br />拼出 <em>CAT</em></h1>
              <p className="english-hero-description">先聽單字，再把三個字母放到正確位置。每一次操作，都會留下孩子真正理解的學習證據。</p>
              <div className="english-coach-note">
                <span className="english-coach-mark" aria-hidden="true">芽</span>
                <div><strong>芽芽為什麼推薦這一課</strong><p>{lessonReason}</p></div>
              </div>
              <button className="english-primary-button" type="button" onClick={() => setScreen('lesson')}>
                {lessonState.attempts > 0 ? '再練一次' : '開始這一課'} <ArrowRight aria-hidden="true" />
              </button>
            </div>

            <div className="english-hero-model" aria-label="單字 CAT 由 C、A、T 三個字母組成">
              <div className="english-home-cat"><CatIllustration /></div>
              <div className="english-preview-letters" aria-hidden="true"><span>C</span><span>A</span><span>T</span></div>
              <strong>CAT</strong>
              <p>聽 /kæt/ · 找字母 · 拼成單字</p>
            </div>
          </section>

          <section className="english-home-details" aria-label="今天的學習內容">
            <div>
              <span className="english-section-label">這堂課怎麼進行</span>
              <ol>
                <li><strong>01</strong><span>聽完整單字 CAT</span></li>
                <li><strong>02</strong><span>依聲音選 C、A、T</span></li>
                <li><strong>03</strong><span>看見字母組成真正的單字</span></li>
              </ol>
            </div>
            <aside>
              <span className="english-section-label">目前狀態</span>
              <strong>{Math.round(lessonState.mastery * 100)}%</strong>
              <p>字母與起始音掌握度</p>
              <dl>
                <div><dt>練習</dt><dd>{lessonState.attempts} 次</dd></div>
                <div><dt>提示</dt><dd>{lessonState.hintCount} 次</dd></div>
                <div><dt>重試</dt><dd>{lessonState.retryCount} 次</dd></div>
              </dl>
              <button type="button" onClick={() => setScreen('growth')}>查看 2D 成長路徑 <ArrowRight aria-hidden="true" /></button>
            </aside>
          </section>
        </main>
      ) : null}

      {screen === 'lesson' ? (
        <Suspense fallback={<div className="english-lesson-loading" role="status">正在準備英文互動課…</div>}>
          <EnglishWordLesson onBack={() => setScreen('home')} onComplete={completeEnglishWordLesson} />
        </Suspense>
      ) : null}

      {screen === 'growth' ? (
        <main id="growth-path" className="english-growth-page">
          <EnglishLearningPath states={progress.topicStates} onStartLesson={() => setScreen('lesson')} />
        </main>
      ) : null}

      {screen === 'parent' ? (
        <EnglishParentSkillMap states={progress.topicStates} recommendationReason={parentRecommendationReason} />
      ) : null}

      <div className="sr-only" aria-live="polite">{lessonReason}</div>
      <ProfileDialog open={profileOpen} auth={auth} childAlias={progress.childAlias} onClose={() => setProfileOpen(false)} onSaveAlias={setChildAlias} />
    </div>
  );
}
