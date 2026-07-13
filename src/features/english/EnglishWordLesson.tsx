import {ArrowCounterClockwise, ArrowLeft, ArrowRight, Lightbulb, SealCheck, SpeakerHigh} from '@phosphor-icons/react';
import {useState} from 'react';
import {CatIllustration} from './CatIllustration';
import {
  ENGLISH_WORD,
  ENGLISH_WORD_TILES,
  initialEnglishWordLessonState,
  markEnglishWordHeard,
  requestEnglishWordHint,
  resetEnglishWord,
  selectEnglishWordLetter,
  type EnglishWordFeedback,
  type EnglishWordLetter,
  type EnglishWordLessonSummary,
} from './englishWordLessonState';

interface EnglishWordLessonProps {
  onBack: () => void;
  onComplete: (summary: EnglishWordLessonSummary) => void;
}

const feedbackCopy: Record<EnglishWordFeedback, string> = {
  ready: '先按播放，聽聽 CAT 的聲音。',
  listened: '你聽到 /kæt/。現在從第一個聲音 /k/ 開始。',
  correct: '放對了。接著聽下一個聲音。',
  wrong: '這個字母還不在這一格。看看亮起來的提示。',
  hint: '亮起來的字母，就是下一個要放的位置。',
  complete: 'C、A、T 合在一起就是 CAT。你把聲音和字母接起來了。',
};

export function EnglishWordLesson({onBack, onComplete}: EnglishWordLessonProps) {
  const [state, setState] = useState(initialEnglishWordLessonState);
  const complete = state.feedback === 'complete';

  const listen = () => {
    if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('cat');
      utterance.lang = 'en-US';
      utterance.rate = 0.72;
      window.speechSynthesis.speak(utterance);
    }
    setState((current) => markEnglishWordHeard(current));
  };

  const chooseLetter = (letter: EnglishWordLetter) => {
    const next = selectEnglishWordLetter(state, letter);
    setState(next);
    if (state.feedback !== 'complete' && next.feedback === 'complete') {
      onComplete({hintCount: next.hintCount, retryCount: next.retryCount});
    }
  };

  return (
    <main id="interactive-lesson" className="english-word-lesson">
      <header className="english-lesson-header">
        <button type="button" className="english-back-button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" /> 回到今天
        </button>
        <div>
          <span>英文互動課 · Phonics</span>
          <strong>聽聲音，拼單字</strong>
        </div>
        <span className="english-step-count">1 / 1</span>
      </header>

      <section className="english-lesson-workspace" aria-labelledby="english-lesson-title">
        <div className="english-lesson-instruction">
          <span>今天只學一件事</span>
          <h1 id="english-lesson-title">拼出 CAT</h1>
          <p>先聽完整單字，再照聲音順序選出三個字母。</p>
          <button type="button" className="listen-word-button" onClick={listen}>
            <SpeakerHigh aria-hidden="true" weight="fill" />
            {state.heard ? '再聽一次 CAT' : '播放 CAT'}
          </button>
          <p className="phoneme-fallback">CAT · /kæt/</p>
        </div>

        <div className={`english-word-model${complete ? ' is-complete' : ''}`}>
          <div className="cat-reveal" aria-live="polite">
            {complete ? <CatIllustration label="一隻貓，代表單字 CAT" /> : <span aria-hidden="true">?</span>}
          </div>

          <div className="word-slots" aria-label="CAT 字母位置">
            {ENGLISH_WORD.map((letter, index) => (
              <span key={letter} className={state.placed[index] ? 'is-filled' : ''}>
                {state.placed[index] ?? <i aria-hidden="true">{index + 1}</i>}
              </span>
            ))}
          </div>

          <div className="letter-tiles" aria-label="選擇字母">
            {ENGLISH_WORD_TILES.map((letter) => {
              const used = state.placed.includes(letter);
              const highlighted = state.highlightedLetter === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  className={highlighted ? 'is-highlighted' : ''}
                  onClick={() => chooseLetter(letter)}
                  disabled={!state.heard || used || complete}
                  aria-pressed={used}
                  aria-label={`字母 ${letter}${highlighted ? '，提示的下一個字母' : ''}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="english-lesson-feedback" aria-label="芽芽的提示">
        <span className="english-coach-mark" aria-hidden="true">芽</span>
        <div>
          <strong>{complete ? '你發現了什麼？' : '芽芽提示'}</strong>
          <p role="status" aria-live="polite">{feedbackCopy[state.feedback]}</p>
        </div>
        <div className="english-feedback-actions">
          {complete ? (
            <button type="button" className="english-primary-button" onClick={onBack}>
              <SealCheck aria-hidden="true" weight="fill" /> 完成這一課 <ArrowRight aria-hidden="true" />
            </button>
          ) : (
            <>
              <button type="button" onClick={() => setState((current) => requestEnglishWordHint(current))} disabled={!state.heard}>
                <Lightbulb aria-hidden="true" /> 給我提示
              </button>
              <button type="button" onClick={() => setState((current) => resetEnglishWord(current))} disabled={state.placed.length === 0}>
                <ArrowCounterClockwise aria-hidden="true" /> 重新排
              </button>
            </>
          )}
        </div>
      </aside>
    </main>
  );
}
