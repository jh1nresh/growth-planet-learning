import {ArrowLeft, ArrowRight, Lightbulb, Minus, Package, Plus, SealCheck} from '@phosphor-icons/react';
import {useState} from 'react';
import {PlaceValueCanvas} from './PlaceValueCanvas';
import type {PlaceValueLessonContent} from '../../lib/lessonContent';

export interface LessonEvidenceSummary {
  hintCount: number;
  retryCount: number;
}

interface PlaceValueLessonProps {
  onBack: () => void;
  onComplete: (summary: LessonEvidenceSummary) => void;
  content: PlaceValueLessonContent;
  locale: 'zh-TW' | 'zh-CN';
}

export function PlaceValueLesson({onBack, onComplete, content, locale}: PlaceValueLessonProps) {
  const [tens, setTens] = useState(0);
  const [ones, setOnes] = useState(0);
  const [stage, setStage] = useState<'build' | 'question' | 'complete'>('build');
  const [hintCount, setHintCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [message, setMessage] = useState(content.messages.initial);
  const total = tens * 10 + ones;
  const canBundle = ones >= 10 && tens < 3;

  const addOne = () => {
    if (stage !== 'build' || total >= 39) return;
    setOnes((current) => current + 1);
    setMessage(content.messages.added);
  };

  const removeOne = () => {
    if (stage !== 'build' || ones === 0) return;
    setOnes((current) => current - 1);
  };

  const bundleTen = () => {
    if (!canBundle) return;
    setOnes((current) => current - 10);
    setTens((current) => current + 1);
    setMessage(tens === 2 ? content.messages.thirdBundle : content.messages.bundled);
  };

  const checkBuild = () => {
    if (tens === 3 && ones === 4) {
      setStage('question');
      setMessage(content.messages.built);
      return;
    }
    setRetryCount((current) => current + 1);
    setMessage(total < 34 ? content.messages.tooLow : content.messages.tooHigh);
  };

  const answer = (value: number) => {
    if (value !== 30) {
      setRetryCount((current) => current + 1);
      setMessage(content.messages.wrongAnswer);
      return;
    }
    setStage('complete');
    setMessage(content.messages.correctAnswer);
    onComplete({hintCount, retryCount});
  };

  const requestHint = () => {
    setHintCount((current) => current + 1);
    setMessage(tens < 3 ? content.messages.hintBundle : content.messages.hintOnes);
  };

  return (
    <main id="interactive-lesson" className="interactive-lesson" lang={locale}>
      <header className="lesson-header">
        <button className="lesson-back-button" type="button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" /> {content.backLabel}
        </button>
        <div>
          <span>{content.subjectLine}</span>
          <h1>{content.title}</h1>
        </div>
        <div className="lesson-total" aria-label={`${content.currentLabel} ${total}`}><span>{content.currentLabel}</span><strong>{total}</strong></div>
      </header>

      <section className="lesson-workspace" aria-labelledby="lesson-instruction">
        <div className="lesson-instruction">
          <span>{content.instructionEyebrow}</span>
          <h2 id="lesson-instruction">{content.instructionTitle}</h2>
          <p>{content.instructionBody}</p>
        </div>
        <PlaceValueCanvas tens={tens} ones={ones} onAddOne={addOne} labels={content.canvas} />
        <div className="lesson-controls" aria-label={content.title}>
          <button type="button" onClick={addOne} disabled={stage !== 'build' || total >= 39}>
            <Plus aria-hidden="true" /> {content.addLabel}
          </button>
          <button type="button" onClick={removeOne} disabled={stage !== 'build' || ones === 0}>
            <Minus aria-hidden="true" /> {content.removeLabel}
          </button>
          <button className="bundle-button" type="button" onClick={bundleTen} disabled={stage !== 'build' || !canBundle}>
            <Package aria-hidden="true" /> {content.bundleLabel}
          </button>
        </div>
      </section>

      <aside className="lesson-coach" aria-label="芽芽的提示">
        <span className="tutor-avatar" aria-hidden="true">芽</span>
        <div>
          <strong>{content.coachLabel}</strong>
          <p role="status" aria-live="polite">{message}</p>
        </div>
        {stage === 'build' ? (
          <div className="lesson-actions">
            <button className="hint-button" type="button" onClick={requestHint}><Lightbulb aria-hidden="true" /> {content.hintLabel}</button>
            <button className="primary-button" type="button" onClick={checkBuild}>{content.checkLabel} <ArrowRight aria-hidden="true" /></button>
          </div>
        ) : null}
        {stage === 'question' ? (
          <fieldset className="place-value-question">
            <legend>{content.question}</legend>
            {[3, 30, 300].map((value) => <button key={value} type="button" onClick={() => answer(value)}>{value}</button>)}
          </fieldset>
        ) : null}
        {stage === 'complete' ? (
          <div className="lesson-complete" role="status">
            <SealCheck aria-hidden="true" weight="fill" />
            <div><strong>{content.completeTitle}</strong><p>{content.completeBody}</p></div>
            <button className="primary-button" type="button" onClick={onBack}>{content.nextLabel} <ArrowRight aria-hidden="true" /></button>
          </div>
        ) : null}
      </aside>
    </main>
  );
}
