import {ArrowLeft, ArrowRight, Lightbulb, Minus, Package, Plus, SealCheck} from '@phosphor-icons/react';
import {useState} from 'react';
import {PlaceValueCanvas} from './PlaceValueCanvas';

export interface LessonEvidenceSummary {
  hintCount: number;
  retryCount: number;
}

interface PlaceValueLessonProps {
  onBack: () => void;
  onComplete: (summary: LessonEvidenceSummary) => void;
}

export function PlaceValueLesson({onBack, onComplete}: PlaceValueLessonProps) {
  const [tens, setTens] = useState(0);
  const [ones, setOnes] = useState(0);
  const [stage, setStage] = useState<'build' | 'question' | 'complete'>('build');
  const [hintCount, setHintCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [message, setMessage] = useState('先放入十個一，再把它們綁成一個十。');
  const total = tens * 10 + ones;
  const canBundle = ones >= 10 && tens < 3;

  const addOne = () => {
    if (stage !== 'build' || total >= 39) return;
    setOnes((current) => current + 1);
    setMessage('很好，繼續觀察個位有幾個一。');
  };

  const removeOne = () => {
    if (stage !== 'build' || ones === 0) return;
    setOnes((current) => current - 1);
  };

  const bundleTen = () => {
    if (!canBundle) return;
    setOnes((current) => current - 10);
    setTens((current) => current + 1);
    setMessage(tens === 2 ? '三個十完成了，現在留下四個一。' : '十個一和一個十，數量完全一樣。');
  };

  const checkBuild = () => {
    if (tens === 3 && ones === 4) {
      setStage('question');
      setMessage('你蓋出了 34。最後想一想：十位上的 3 代表多少？');
      return;
    }
    setRetryCount((current) => current + 1);
    setMessage(total < 34 ? '還差一點。看看需要幾個十和幾個一。' : '超過 34 了，先拿走一些個位積木。');
  };

  const answer = (value: number) => {
    if (value !== 30) {
      setRetryCount((current) => current + 1);
      setMessage('再看看：每一根十位塔裡都有十個一。');
      return;
    }
    setStage('complete');
    setMessage('答對了，3 個十就是 30。');
    onComplete({hintCount, retryCount});
  };

  const requestHint = () => {
    setHintCount((current) => current + 1);
    setMessage(tens < 3 ? '每湊滿十個一，就按一次「綁成一個十」。' : '三個十是 30，所以個位還需要 4。');
  };

  return (
    <main id="interactive-lesson" className="interactive-lesson">
      <header className="lesson-header">
        <button className="lesson-back-button" type="button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" /> 回到今天
        </button>
        <div>
          <span>數學 · 十位與個位</span>
          <h1>用十個一，蓋出 34</h1>
        </div>
        <div className="lesson-total" aria-label={`目前是 ${total}`}><span>目前</span><strong>{total}</strong></div>
      </header>

      <section className="lesson-workspace" aria-labelledby="lesson-instruction">
        <div className="lesson-instruction">
          <span>今天只做一件事</span>
          <h2 id="lesson-instruction">把十個一換成一個十</h2>
          <p>拖曳藍色積木，或使用下方按鈕。目標是 3 個十和 4 個一。</p>
        </div>
        <PlaceValueCanvas tens={tens} ones={ones} onAddOne={addOne} />
        <div className="lesson-controls" aria-label="位值塔操作">
          <button type="button" onClick={addOne} disabled={stage !== 'build' || total >= 39}>
            <Plus aria-hidden="true" /> 放入一個一
          </button>
          <button type="button" onClick={removeOne} disabled={stage !== 'build' || ones === 0}>
            <Minus aria-hidden="true" /> 拿走一個一
          </button>
          <button className="bundle-button" type="button" onClick={bundleTen} disabled={stage !== 'build' || !canBundle}>
            <Package aria-hidden="true" /> 綁成一個十
          </button>
        </div>
      </section>

      <aside className="lesson-coach" aria-label="芽芽的提示">
        <span className="tutor-avatar" aria-hidden="true">芽</span>
        <div>
          <strong>芽芽正在看你的方法</strong>
          <p role="status" aria-live="polite">{message}</p>
        </div>
        {stage === 'build' ? (
          <div className="lesson-actions">
            <button className="hint-button" type="button" onClick={requestHint}><Lightbulb aria-hidden="true" /> 給我提示</button>
            <button className="primary-button" type="button" onClick={checkBuild}>檢查 34 <ArrowRight aria-hidden="true" /></button>
          </div>
        ) : null}
        {stage === 'question' ? (
          <fieldset className="place-value-question">
            <legend>十位上的 3 代表多少？</legend>
            {[3, 30, 300].map((value) => <button key={value} type="button" onClick={() => answer(value)}>{value}</button>)}
          </fieldset>
        ) : null}
        {stage === 'complete' ? (
          <div className="lesson-complete" role="status">
            <SealCheck aria-hidden="true" weight="fill" />
            <div><strong>位值塔完成</strong><p>你的操作已經記進學習路徑。</p></div>
            <button className="primary-button" type="button" onClick={onBack}>看看下一站 <ArrowRight aria-hidden="true" /></button>
          </div>
        ) : null}
      </aside>
    </main>
  );
}
