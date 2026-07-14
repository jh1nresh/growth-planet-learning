import {ArrowLeft, ArrowRight, Lightbulb, SealCheck, ShieldCheck, SpeakerHigh} from '@phosphor-icons/react';
import {useEffect, useRef, useState} from 'react';
import type {EnglishCourseScenario} from './englishCourse';
import {
  beginEnglishCardRepeat,
  finishEnglishCardRepeat,
  finishEnglishCardTurn,
  initialEnglishCardLessonState,
  markEnglishCardModelHeard,
  requestEnglishCardHint,
  selectEnglishCardIntent,
  selectEnglishCardToken,
  type EnglishCardLessonSummary,
} from './englishCardLessonState';

interface EnglishCardLessonProps {
  scenario: EnglishCourseScenario;
  onBack: () => void;
  onComplete: (summary: EnglishCardLessonSummary) => void;
}

function speak(text: string) {
  try {
    if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.72;
      window.speechSynthesis.speak(utterance);
    }
  } catch {
    // The visible sentence keeps every step playable without speech synthesis.
  }
}

export function EnglishCardLesson({scenario, onBack, onComplete}: EnglishCardLessonProps) {
  const [state, setState] = useState(initialEnglishCardLessonState);
  const lessonRef = useRef<HTMLElement>(null);
  const scenarioNumber = Number(scenario.id.match(/english_life_(\d+)/)?.[1] ?? 1);

  useEffect(() => {
    window.scrollTo({top: 0, behavior: 'auto'});
    return () => window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    if (state.step === 'model') return;
    const selector = state.step === 'intent'
      ? '.english-card-intent button'
      : state.step === 'assemble'
        ? '.english-card-tokens button:not(:disabled)'
        : '.english-feedback-actions button';
    const frame = window.requestAnimationFrame(() => {
      lessonRef.current?.querySelector<HTMLElement>(selector)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state.step, state.placedTokens.length]);

  const playModel = () => {
    setState((current) => markEnglishCardModelHeard(current));
    speak(scenario.modelText);
  };

  const beginRepeat = () => {
    setState((current) => beginEnglishCardRepeat(current));
    speak(scenario.modelText);
  };

  const finishRepeat = () => {
    const next = finishEnglishCardRepeat(state);
    setState(next);
    if (state.step === 'repeat' && next.step === 'complete') {
      onComplete({hintCount: next.hintCount, retryCount: next.retryCount});
    }
  };

  const feedback = state.step === 'model'
    ? `先看「${scenario.translation}」的情境，再聽完整句子。`
    : state.step === 'intent'
      ? state.highlightedChoice ? `提示亮起來了：${scenario.correctIntent}。` : scenario.intentPrompt
      : state.step === 'assemble'
        ? state.highlightedChoice
          ? `下一個字是 ${state.highlightedChoice}。`
          : `已放入 ${state.placedTokens.length} / ${scenario.tokens.length} 個字；請選下一個字。`
        : state.step === 'speak'
          ? '芽芽現在安靜等你。自己說完完整句子，再按「我說完了」。'
          : state.step === 'review'
            ? scenario.reviewPoint
            : state.step === 'repeat'
              ? '再說一次完整句子；說完後由你自己按完成。'
              : '你完成了意思理解、句子排列和兩次開口練習。Oshiami 沒有錄下你的聲音。';

  return (
    <main ref={lessonRef} id="interactive-lesson" className="english-word-lesson english-speaking-lesson english-card-lesson" lang="zh-TW">
      <header className="english-lesson-header">
        <button type="button" className="english-back-button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" /> 回到今天
        </button>
        <div><span>英文互動課 · Life English</span><strong>{scenario.scene}</strong></div>
        <span className="english-step-count">{scenarioNumber} / 10</span>
      </header>

      <section className="english-lesson-workspace" aria-labelledby="english-card-title">
        <div className="english-lesson-instruction">
          <span>一個情境，一句真的會用到的英文</span>
          <h1 id="english-card-title">{scenario.title}</h1>
          <p>{scenario.translation}</p>
          <button type="button" className={`listen-word-button${state.step === 'model' ? '' : ' is-secondary'}`} onClick={playModel}>
            <SpeakerHigh aria-hidden="true" weight="fill" />
            {state.step === 'model' ? '播放句子並開始' : '再聽一次句子'}
          </button>
          <p className="phoneme-fallback" lang="en">{scenario.modelText}</p>
        </div>

        <div className={`english-speaking-model english-card-model${state.step === 'complete' ? ' is-complete' : ''}`}>
          <div className="english-card-scene">
            <span>{scenario.scene}</span>
            <strong lang="en">{scenario.modelText}</strong>
            <small>{scenario.translation}</small>
          </div>

          {state.step === 'intent' ? (
            <fieldset className="english-card-intent">
              <legend>{scenario.intentPrompt}</legend>
              {scenario.intentChoices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={state.highlightedChoice === choice ? 'is-highlighted' : ''}
                  onClick={() => setState((current) => selectEnglishCardIntent(current, scenario, choice))}
                >
                  {choice}
                </button>
              ))}
            </fieldset>
          ) : null}

          {state.step !== 'model' && state.step !== 'intent' ? (
            <ol className="english-phrase-board english-card-phrase" aria-label={`${scenario.title} 句子排列`} lang="en">
              {scenario.tokens.map((token, index) => (
                <li key={`${token}-${index}`} className={state.placedTokens[index] ? 'is-filled' : ''}>
                  {state.placedTokens[index] ?? index + 1}
                </li>
              ))}
            </ol>
          ) : null}

          {state.step === 'assemble' ? (
            <div className="english-speaking-choices english-card-tokens" aria-label="選擇下一個英文字">
              <p>選下一個字</p>
              <div>
                {scenario.tileChoices.map((choice) => {
                  const used = state.placedTokens.includes(choice);
                  return (
                    <button
                      key={choice}
                      type="button"
                      className={state.highlightedChoice === choice ? 'is-highlighted' : ''}
                      onClick={() => setState((current) => selectEnglishCardToken(current, scenario, choice))}
                      disabled={used}
                      lang="en"
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {['speak', 'review', 'repeat', 'complete'].includes(state.step) ? (
            <div className="english-speaking-turn">
              <strong lang="en">“{scenario.modelText}”</strong>
              <p><ShieldCheck aria-hidden="true" weight="fill" /> 不錄音 · 不做發音評分</p>
              {state.step === 'review' ? <span>{scenario.reviewPoint}</span> : null}
            </div>
          ) : null}
        </div>
      </section>

      <aside className="english-lesson-feedback" aria-label="芽芽的提示">
        <span className="english-coach-mark" aria-hidden="true">芽</span>
        <div><strong>{state.step === 'complete' ? '完成' : '芽芽提示'}</strong><p role="status" aria-live="polite">{feedback}</p></div>
        <div className="english-feedback-actions">
          {state.step === 'intent' || state.step === 'assemble' ? (
            <button type="button" onClick={() => setState((current) => requestEnglishCardHint(current, scenario))}>
              <Lightbulb aria-hidden="true" /> 給我提示
            </button>
          ) : state.step === 'speak' ? (
            <button type="button" className="english-primary-button" onClick={() => setState((current) => finishEnglishCardTurn(current))}>
              我說完了 <ArrowRight aria-hidden="true" />
            </button>
          ) : state.step === 'review' ? (
            <button type="button" className="english-primary-button" onClick={beginRepeat}>
              聽一次，再說 <SpeakerHigh aria-hidden="true" />
            </button>
          ) : state.step === 'repeat' ? (
            <button type="button" className="english-primary-button" onClick={finishRepeat}>
              第二次說完了 <ArrowRight aria-hidden="true" />
            </button>
          ) : state.step === 'complete' ? (
            <button type="button" className="english-primary-button" onClick={onBack}>
              <SealCheck aria-hidden="true" weight="fill" /> 完成這一課 <ArrowRight aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </aside>
    </main>
  );
}
