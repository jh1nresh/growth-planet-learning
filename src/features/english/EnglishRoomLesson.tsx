import {
  Armchair,
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  Backpack,
  Lightbulb,
  SealCheck,
  ShieldCheck,
  SpeakerHigh,
} from '@phosphor-icons/react';
import {useEffect, useRef, useState} from 'react';
import roomDioramaUrl from '../../assets/english-room-diorama.svg';
import type {EnglishCourseScenario} from './englishCourse';
import {
  beginEnglishRoomRepeat,
  checkEnglishRoomPosition,
  ENGLISH_ROOM_CHALLENGES,
  finishEnglishRoomRepeat,
  finishEnglishRoomTurn,
  initialEnglishRoomLessonState,
  moveEnglishRoomBag,
  requestEnglishRoomHint,
  selectEnglishRoomToken,
  type EnglishRoomLessonSummary,
} from './englishRoomLessonState';

interface EnglishRoomLessonProps {
  scenario: EnglishCourseScenario;
  onBack: () => void;
  onComplete: (summary: EnglishRoomLessonSummary) => void;
}

const positionCopy = {
  on: {
    keyword: 'ON',
    label: '椅子上面',
    status: '書包現在在椅子上面。',
    sentence: 'The bag is on the chair.',
  },
  under: {
    keyword: 'UNDER',
    label: '椅子下面',
    status: '書包現在在椅子下面。',
    sentence: 'The bag is under the chair.',
  },
  'next-to': {
    keyword: 'NEXT TO',
    label: '椅子旁邊',
    status: '書包現在在椅子旁邊。',
    sentence: 'The bag is next to the chair.',
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
    // The visible prompt keeps the lesson playable without speech synthesis.
  }
}

export function EnglishRoomLesson({scenario, onBack, onComplete}: EnglishRoomLessonProps) {
  const [state, setState] = useState(initialEnglishRoomLessonState);
  const lessonRef = useRef<HTMLElement>(null);
  const completionReported = useRef(false);
  const currentPosition = positionCopy[state.bagPosition];
  const targetPosition = ENGLISH_ROOM_CHALLENGES[state.challengeIndex] ?? 'under';
  const targetCopy = positionCopy[targetPosition];
  const listeningPrompt = state.step === 'position'
    ? `Put the bag ${targetPosition === 'next-to' ? 'next to' : targetPosition} the chair.`
    : scenario.modelText;

  useEffect(() => {
    window.scrollTo({top: 0, behavior: 'auto'});
    return () => window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    const selector = state.step === 'position'
      ? '.room-position-controls button'
      : state.step === 'assemble'
        ? '.room-token-choices button:not(:disabled)'
        : '.english-feedback-actions button';
    const frame = window.requestAnimationFrame(() => {
      lessonRef.current?.querySelector<HTMLElement>(selector)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state.challengeIndex, state.placedTokens.length, state.step]);

  const playPrompt = () => {
    speak(listeningPrompt);
  };

  const finishRepeat = () => {
    const next = finishEnglishRoomRepeat(state);
    setState(next);
    if (state.step === 'repeat' && next.step === 'complete' && !completionReported.current) {
      completionReported.current = true;
      onComplete({hintCount: next.hintCount, retryCount: next.retryCount});
    }
  };

  const feedback = state.step === 'position'
    ? state.highlightedPosition
      ? `再觀察一次：${targetCopy.keyword} 是${targetCopy.label}。移動後再檢查。`
      : `目前是 ${currentPosition.keyword}。先改變位置，再看看英文句子跟著怎麼變。`
    : state.step === 'assemble'
      ? state.highlightedToken
        ? `下一個字是 ${state.highlightedToken}。`
        : `書包回到椅子下面。已放入 ${state.placedTokens.length} / ${scenario.tokens.length} 個字。`
      : state.step === 'speak'
        ? '看著房間，自己說完完整句子，再按「我說完了」。'
        : state.step === 'review'
          ? '位置改變，介系詞也會改變；under 就是在物品下面。'
          : state.step === 'repeat'
            ? '最後再說一次完整句子；Oshiami 不會錄音。'
            : '你先改變房間，再用英文說出結果。這才是今天留下的學習證據。';

  return (
    <main ref={lessonRef} id="interactive-lesson" className="english-word-lesson english-room-lesson" lang="zh-TW">
      <header className="english-lesson-header">
        <button type="button" className="english-back-button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" /> 回到今天
        </button>
        <div><span>英文互動課 · Room Lab</span><strong>回答位置</strong></div>
        <span className="english-step-count">8 / 10</span>
      </header>

      <section className="english-lesson-workspace room-lesson-workspace" aria-labelledby="english-room-title">
        <div className="english-lesson-instruction room-lesson-instruction">
          <span>ROOM LAB · 改變位置，看見英文</span>
          <h1 id="english-room-title">Where is my bag?</h1>
          <p>
            {state.step === 'position'
              ? <>任務 {state.challengeIndex + 1} / {ENGLISH_ROOM_CHALLENGES.length}：把書包移到<strong>{targetCopy.label}</strong>。</>
              : <>觀察房間，再排出「{scenario.translation}」。</>}
          </p>
          <button type="button" className="listen-word-button" onClick={playPrompt}>
            <SpeakerHigh aria-hidden="true" weight="fill" />
            {state.step === 'position' ? '聽目前任務' : '聽完整句子'}
          </button>
          <p className="phoneme-fallback" lang="en">
            {listeningPrompt}
          </p>
        </div>

        <div className={`english-speaking-model room-simulator-model${state.step === 'complete' ? ' is-complete' : ''}`}>
          <div className="room-simulator-heading">
            <div>
              <span>LIVE ROOM</span>
              <strong>{state.step === 'position' ? `任務：${targetCopy.keyword}` : 'LOOK & SAY'}</strong>
            </div>
            {state.step === 'position' ? (
              <button
                type="button"
                className="room-reset-button"
                onClick={() => setState((current) => moveEnglishRoomBag(current, 'next-to'))}
                aria-label="把書包重設到椅子旁邊"
              >
                <ArrowCounterClockwise aria-hidden="true" /> 重設
              </button>
            ) : null}
          </div>

          <div className="room-simulator-stage" data-position={state.bagPosition} aria-hidden="true">
            <img className="room-diorama-art" src={roomDioramaUrl} alt="" />
            <div className="room-chair-anchor">
              <span className="room-zone-label room-zone-on">ON</span>
              <span className="room-zone-label room-zone-under">UNDER</span>
              <span className="room-zone-label room-zone-next">NEXT TO</span>
              <Armchair className="room-chair" weight="duotone" />
              <span className={`room-bag is-${state.bagPosition}`}>
                <Backpack weight="duotone" />
              </span>
            </div>
          </div>

          <p className="room-position-status">
            <span>{currentPosition.keyword}</span>
            <strong lang="en">{currentPosition.sentence}</strong>
            <small>{currentPosition.status}</small>
          </p>

          {state.step === 'position' ? (
            <fieldset className="room-position-controls">
              <legend>把書包移到哪裡？</legend>
              {(['on', 'under', 'next-to'] as const).map((position) => {
                const copy = positionCopy[position];
                return (
                  <button
                    key={position}
                    type="button"
                    data-position={position}
                    aria-pressed={state.bagPosition === position}
                    className={state.highlightedPosition === position ? 'is-highlighted' : ''}
                    onClick={() => setState((current) => moveEnglishRoomBag(current, position))}
                  >
                    <strong lang="en">{copy.keyword}</strong>
                    <span>{copy.label}</span>
                  </button>
                );
              })}
              <div className="room-position-coach">
                <span className="english-coach-mark" aria-hidden="true">芽</span>
                <p role="status" aria-live="polite" aria-atomic="true">{feedback}</p>
                <div className="english-feedback-actions room-position-actions">
                  <button type="button" onClick={() => setState((current) => requestEnglishRoomHint(current, scenario))}>
                    <Lightbulb aria-hidden="true" /> 給我提示
                  </button>
                  <button type="button" className="english-primary-button" onClick={() => setState((current) => checkEnglishRoomPosition(current))}>
                    檢查位置 <ArrowRight aria-hidden="true" />
                  </button>
                </div>
              </div>
            </fieldset>
          ) : null}

          {state.step !== 'position' ? (
            <ol className="english-phrase-board english-card-phrase room-phrase-board" aria-label="It is under the chair 句子排列" lang="en">
              {scenario.tokens.map((token, index) => (
                <li key={`${token}-${index}`} className={state.placedTokens[index] ? 'is-filled' : ''}>
                  {state.placedTokens[index] ?? index + 1}
                </li>
              ))}
            </ol>
          ) : null}

          {state.step === 'assemble' ? (
            <div className="english-speaking-choices room-token-choices" aria-label="選擇下一個英文字">
              <p>看著房間，選下一個字</p>
              <div>
                {scenario.tileChoices.map((choice) => {
                  const used = state.placedTokens.includes(choice);
                  return (
                    <button
                      key={choice}
                      type="button"
                      className={state.highlightedToken === choice ? 'is-highlighted' : ''}
                      onClick={() => setState((current) => selectEnglishRoomToken(current, scenario, choice))}
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
            <div className="english-speaking-turn room-speaking-turn">
              <strong lang="en">“{scenario.modelText}”</strong>
              <p><ShieldCheck aria-hidden="true" weight="fill" /> 不錄音 · 不做發音評分</p>
              {state.step === 'review' ? <span>{scenario.reviewPoint}</span> : null}
            </div>
          ) : null}
        </div>
      </section>

      {state.step !== 'position' ? (
        <aside className="english-lesson-feedback" aria-label="芽芽的提示">
          <span className="english-coach-mark" aria-hidden="true">芽</span>
          <div><strong>{state.step === 'complete' ? '完成' : '芽芽提示'}</strong><p role="status" aria-live="polite" aria-atomic="true">{feedback}</p></div>
          <div className="english-feedback-actions">
            {state.step === 'assemble' ? (
              <button type="button" onClick={() => setState((current) => requestEnglishRoomHint(current, scenario))}>
                <Lightbulb aria-hidden="true" /> 給我提示
              </button>
            ) : null}
            {state.step === 'speak' ? (
            <button type="button" className="english-primary-button" onClick={() => setState((current) => finishEnglishRoomTurn(current))}>
              我說完了 <ArrowRight aria-hidden="true" />
            </button>
          ) : state.step === 'review' ? (
            <button type="button" className="english-primary-button" onClick={() => {
              setState((current) => beginEnglishRoomRepeat(current));
              speak(scenario.modelText);
            }}>
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
      ) : null}
    </main>
  );
}
