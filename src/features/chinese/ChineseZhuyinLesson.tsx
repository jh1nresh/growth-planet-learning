import {ArrowCounterClockwise, ArrowLeft, ArrowRight, Lightbulb, SealCheck, SpeakerHigh} from '@phosphor-icons/react';
import {useState} from 'react';
import {
  CHINESE_ZHUYIN_SEQUENCE,
  CHINESE_ZHUYIN_TILES,
  initialChineseZhuyinLessonState,
  markChineseWordHeard,
  requestChineseZhuyinHint,
  resetChineseZhuyin,
  selectChineseZhuyinSymbol,
  type ChineseZhuyinFeedback,
  type ChineseZhuyinLessonSummary,
  type ChineseZhuyinSymbol,
} from './chineseZhuyinLessonState';

interface ChineseZhuyinLessonProps {
  onBack: () => void;
  onComplete: (summary: ChineseZhuyinLessonSummary) => void;
}

const feedbackCopy: Record<ChineseZhuyinFeedback, string> = {
  ready: '先按播放，聽聽「米」的完整讀音。',
  listened: '你聽到「米」。從第一個符號 ㄇ 開始。',
  correct: '放對了。接著找下一個符號。',
  wrong: '這個符號還不在這一格。看看亮起來的提示。',
  hint: '亮起來的符號，就是下一個要放的位置。',
  complete: 'ㄇ、ㄧ、ˇ 依序排好，就是「米」的注音。',
};

export function ChineseZhuyinLesson({onBack, onComplete}: ChineseZhuyinLessonProps) {
  const [state, setState] = useState(initialChineseZhuyinLessonState);
  const complete = state.feedback === 'complete';

  const listen = () => {
    setState((current) => markChineseWordHeard(current));
    try {
      if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('米');
        utterance.lang = 'zh-TW';
        utterance.rate = 0.72;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Visible text and unlocked controls keep the lesson playable without speech.
    }
  };

  const chooseSymbol = (symbol: ChineseZhuyinSymbol) => {
    const next = selectChineseZhuyinSymbol(state, symbol);
    setState(next);
    if (state.feedback !== 'complete' && next.feedback === 'complete') {
      onComplete({hintCount: next.hintCount, retryCount: next.retryCount});
    }
  };

  return (
    <main id="interactive-lesson" className="english-word-lesson chinese-zhuyin-lesson" lang="zh-TW">
      <header className="english-lesson-header">
        <button type="button" className="english-back-button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" /> 回到今天
        </button>
        <div><span>語文互動課 · 注音</span><strong>聽讀音，排注音</strong></div>
        <span className="english-step-count">1 / 1</span>
      </header>

      <section className="english-lesson-workspace" aria-labelledby="chinese-lesson-title">
        <div className="english-lesson-instruction">
          <span>今天只學一件事</span>
          <h1 id="chinese-lesson-title">排出 ㄇㄧˇ</h1>
          <p>先聽「米」，再照讀音順序選出三個注音符號。</p>
          <button type="button" className="listen-word-button" onClick={listen}>
            <SpeakerHigh aria-hidden="true" weight="fill" />
            {state.heard ? '再聽一次「米」' : '播放「米」'}
          </button>
          <p className="phoneme-fallback">米 · ㄇㄧˇ</p>
        </div>

        <div className={`english-word-model chinese-word-model${complete ? ' is-complete' : ''}`}>
          <div className="chinese-character-reveal" aria-live="polite">
            <span aria-hidden="true">{complete ? '米' : '?'}</span>
            <small>{complete ? '白米、米飯的米' : '完成後會找到一個國字'}</small>
          </div>
          <div className="word-slots zhuyin-slots" aria-label="米的注音位置">
            {CHINESE_ZHUYIN_SEQUENCE.map((symbol, index) => (
              <span key={symbol} className={state.placed[index] ? 'is-filled' : ''}>
                {state.placed[index] ?? <i aria-hidden="true">{index + 1}</i>}
              </span>
            ))}
          </div>
          <div className="letter-tiles zhuyin-tiles" aria-label="選擇注音符號">
            {CHINESE_ZHUYIN_TILES.map((symbol) => {
              const used = state.placed.includes(symbol);
              const highlighted = state.highlightedSymbol === symbol;
              return (
                <button
                  key={symbol}
                  type="button"
                  className={highlighted ? 'is-highlighted' : ''}
                  onClick={() => chooseSymbol(symbol)}
                  disabled={!state.heard || used || complete}
                  aria-pressed={used}
                  aria-label={`注音 ${symbol}${highlighted ? '，提示的下一個符號' : ''}`}
                >
                  {symbol}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="english-lesson-feedback" aria-label="芽芽的提示">
        <span className="english-coach-mark" aria-hidden="true">芽</span>
        <div><strong>{complete ? '你發現了什麼？' : '芽芽提示'}</strong><p role="status" aria-live="polite">{feedbackCopy[state.feedback]}</p></div>
        <div className="english-feedback-actions">
          {complete ? (
            <button type="button" className="english-primary-button" onClick={onBack}>
              <SealCheck aria-hidden="true" weight="fill" /> 完成這一課 <ArrowRight aria-hidden="true" />
            </button>
          ) : (
            <>
              <button type="button" onClick={() => setState((current) => requestChineseZhuyinHint(current))} disabled={!state.heard}>
                <Lightbulb aria-hidden="true" /> 給我提示
              </button>
              <button type="button" onClick={() => setState((current) => resetChineseZhuyin(current))} disabled={state.placed.length === 0}>
                <ArrowCounterClockwise aria-hidden="true" /> 重新排
              </button>
            </>
          )}
        </div>
      </aside>
    </main>
  );
}
