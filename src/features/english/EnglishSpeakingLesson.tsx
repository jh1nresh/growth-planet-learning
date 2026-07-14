import {ArrowLeft, ArrowRight, Lightbulb, SealCheck, ShieldCheck, SpeakerHigh} from '@phosphor-icons/react';
import {useEffect, useRef, useState} from 'react';
import {
  beginEnglishSpeakingRepeat,
  ENGLISH_SPEAKING_IS_CHOICES,
  ENGLISH_SPEAKING_MY_CHOICES,
  finishEnglishSpeakingRepeat,
  finishEnglishSpeakingTurn,
  initialEnglishSpeakingLessonState,
  markEnglishSpeakingModelHeard,
  requestEnglishSpeakingHint,
  selectEnglishSpeakingChoice,
  type EnglishSpeakingLessonSummary,
  type EnglishSpeakingStep,
} from './englishSpeakingLessonState';

interface EnglishSpeakingLessonProps {
  onBack: () => void;
  onComplete: (summary: EnglishSpeakingLessonSummary) => void;
}

const instructionCopy: Record<EnglishSpeakingStep, {eyebrow: string; title: string; description: string}> = {
  model: {
    eyebrow: '先聽一個真實情境',
    title: '新朋友問你名字',
    description: '先聽完整對話。這堂課使用虛構角色 Mia，不會要求你的真實姓名。',
  },
  'choose-my': {
    eyebrow: '一次只找一個字',
    title: '哪個字是「我的」？',
    description: '從三個常見字中找出 MY，放進第一格。',
  },
  'choose-is': {
    eyebrow: '接著找第二個字',
    title: '哪個字是「是」？',
    description: '選出 IS，完成 My name is Mia。',
  },
  speak: {
    eyebrow: '現在換你說',
    title: '把整句說完',
    description: '慢慢說「My name is Mia」。芽芽會安靜等你，不會中途打斷。',
  },
  review: {
    eyebrow: '說完才看重點',
    title: '這次只記一件事',
    description: '把 My name is 連在一起，再完整說一次就好。',
  },
  repeat: {
    eyebrow: '最後重說一次',
    title: 'My name is Mia',
    description: '看著完整句子再說一次，說完後按下面的按鈕。',
  },
  complete: {
    eyebrow: '今天的口說完成',
    title: '你說完了一整句',
    description: '你辨認了 MY、IS，也完成了第一個自我介紹句型。',
  },
};

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
    // The visible script and controls keep the lesson playable without speech.
  }
}

export function EnglishSpeakingLesson({onBack, onComplete}: EnglishSpeakingLessonProps) {
  const [state, setState] = useState(initialEnglishSpeakingLessonState);
  const lessonRef = useRef<HTMLElement>(null);
  const copy = instructionCopy[state.step];
  const choosing = state.step === 'choose-my' || state.step === 'choose-is';
  const choices = state.step === 'choose-my'
    ? ENGLISH_SPEAKING_MY_CHOICES
    : state.step === 'choose-is' ? ENGLISH_SPEAKING_IS_CHOICES : [];

  useEffect(() => {
    window.scrollTo({top: 0, behavior: 'auto'});
    return () => window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    if (state.step === 'model') return;
    const selector = choosing
      ? '.english-speaking-choices button'
      : '.english-feedback-actions button';
    const frame = window.requestAnimationFrame(() => {
      lessonRef.current?.querySelector<HTMLElement>(selector)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [choosing, state.step]);

  const playModel = () => {
    setState((current) => markEnglishSpeakingModelHeard(current));
    speak("Hello! What's your name? My name is Mia.");
  };

  const beginRepeat = () => {
    setState((current) => beginEnglishSpeakingRepeat(current));
    speak('My name is Mia.');
  };

  const finishRepeat = () => {
    const next = finishEnglishSpeakingRepeat(state);
    setState(next);
    if (state.step === 'repeat' && next.step === 'complete') {
      onComplete({hintCount: next.hintCount, retryCount: next.retryCount});
    }
  };

  const feedback = state.step === 'model'
    ? '先聽完整示範，再找出句子裡的兩個常見字。'
    : state.step === 'choose-my'
      ? state.highlightedChoice ? '提示亮起來了：MY 是「我的」。' : '找出 MY。一次只處理一個字。'
      : state.step === 'choose-is'
        ? state.highlightedChoice ? '提示亮起來了：IS 放在 NAME 後面。' : '找出 IS，讓句子完整。'
        : state.step === 'speak'
          ? '芽芽現在不說話。你說完完整句子後，再按「我說完了」。'
          : state.step === 'review'
            ? '練習重點：My name is 連著說。這不是發音評分。'
            : state.step === 'repeat'
              ? '再說一次完整句子。芽芽仍然會等你自己按完成。'
              : '你完成了字詞辨認和自我介紹句型。Oshiami 沒有錄下你的聲音。';

  return (
    <main ref={lessonRef} id="interactive-lesson" className="english-word-lesson english-speaking-lesson" lang="zh-TW">
      <header className="english-lesson-header">
        <button type="button" className="english-back-button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" /> 回到今天
        </button>
        <div>
          <span>英文互動課 · Speaking</span>
          <strong>情境開口練習</strong>
        </div>
        <span className="english-step-count">2 / 10</span>
      </header>

      <section className="english-lesson-workspace" aria-labelledby="english-speaking-title">
        <div className="english-lesson-instruction">
          <span>{copy.eyebrow}</span>
          <h1 id="english-speaking-title">{copy.title}</h1>
          <p>{copy.description}</p>
          <button type="button" className={`listen-word-button${state.step === 'model' ? '' : ' is-secondary'}`} onClick={playModel}>
            <SpeakerHigh aria-hidden="true" weight="fill" />
            {state.step === 'model' ? '播放示範並開始' : '再聽一次示範'}
          </button>
          <p className="phoneme-fallback" lang="en">Hello! What&apos;s your name?<br />My name is Mia.</p>
        </div>

        <div className={`english-speaking-model${state.step === 'complete' ? ' is-complete' : ''}`}>
          <div className="english-speaking-scene">
            <span aria-hidden="true">芽</span>
            <div><small>新朋友問</small><strong lang="en">Hello! What&apos;s your name?</strong></div>
          </div>

          <ol className="english-phrase-board" aria-label="My name is Mia 句子排列" lang="en">
            <li className={state.mySelected ? 'is-filled' : ''}>{state.mySelected ? 'MY' : '1'}</li>
            <li className="is-fixed">NAME</li>
            <li className={state.isSelected ? 'is-filled' : ''}>{state.isSelected ? 'IS' : '2'}</li>
            <li className="is-fixed">MIA</li>
          </ol>

          {choosing ? (
            <div className="english-speaking-choices" aria-label={state.step === 'choose-my' ? '選擇代表我的英文字' : '選擇代表是的英文字'}>
              <p>{state.step === 'choose-my' ? '選出「我的」' : '選出「是」'}</p>
              <div>
                {choices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={state.highlightedChoice === choice ? 'is-highlighted' : ''}
                    onClick={() => setState((current) => selectEnglishSpeakingChoice(current, choice))}
                    aria-label={`選擇 ${choice}`}
                    lang="en"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {!choosing && state.step !== 'model' ? (
            <div className="english-speaking-turn">
              <strong lang="en">“My name is Mia.”</strong>
              <p><ShieldCheck aria-hidden="true" weight="fill" /> 不錄音 · Oshiami 聽不到你的聲音</p>
              {state.step === 'review' ? <span>練習重點：把 <b>My name is</b> 連在一起說。</span> : null}
            </div>
          ) : null}
        </div>
      </section>

      <aside className="english-lesson-feedback" aria-label="芽芽的提示">
        <span className="english-coach-mark" aria-hidden="true">芽</span>
        <div>
          <strong>{state.step === 'review' ? '說完後的一個重點' : state.step === 'complete' ? '完成' : '芽芽提示'}</strong>
          <p role="status" aria-live="polite">{feedback}</p>
        </div>
        <div className="english-feedback-actions">
          {choosing ? (
            <button type="button" onClick={() => setState((current) => requestEnglishSpeakingHint(current))}>
              <Lightbulb aria-hidden="true" /> 給我提示
            </button>
          ) : state.step === 'speak' ? (
            <button type="button" className="english-primary-button" onClick={() => setState((current) => finishEnglishSpeakingTurn(current))}>
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
