import {ArrowRight} from '@phosphor-icons/react';
import {CatIllustration} from '../english/CatIllustration';
import type {LearnerTopicState} from '../../types';
import type {LearningStudio} from './learningStudios';

interface LearningStudioHomeProps {
  studio: LearningStudio;
  lessonState: LearnerTopicState;
  recommendationReason: string;
  onStartLesson: () => void;
  onShowGrowth: () => void;
}

function StudioPreview({studio}: {studio: LearningStudio}) {
  if (studio.subject === 'English') {
    return (
      <>
        <div className="english-home-cat"><CatIllustration /></div>
        <div className="english-preview-letters" aria-hidden="true"><span>C</span><span>A</span><span>T</span></div>
        <strong>CAT</strong>
      </>
    );
  }

  if (studio.subject === 'Mathematics') {
    return (
      <>
        <div className="studio-math-model" aria-hidden="true">
          <div className="studio-tens"><span /><span /><span /></div>
          <div className="studio-ones"><i /><i /><i /><i /></div>
        </div>
        <strong>34</strong>
      </>
    );
  }

  return (
    <>
      <div className="studio-chinese-model" aria-hidden="true">
        <span className="studio-character">米</span>
        <div><i>ㄇ</i><i>ㄧ</i><i>ˇ</i></div>
      </div>
      <strong>ㄇㄧˇ</strong>
    </>
  );
}

export function LearningStudioHome({studio, lessonState, recommendationReason, onStartLesson, onShowGrowth}: LearningStudioHomeProps) {
  return (
    <main id="today-lesson" className="english-home">
      <section className="english-hero" aria-labelledby="today-lesson-title">
        <div className="english-hero-copy">
          <span className="english-eyebrow">今日{studio.label} · {studio.duration}</span>
          <p className="english-domain">{studio.domain}</p>
          <h1 id="today-lesson-title">{studio.headlineLead}<br />{studio.headlineTail} <em>{studio.headlineFocus}</em></h1>
          <p className="english-hero-description">{studio.description}</p>
          <div className="english-coach-note">
            <span className="english-coach-mark" aria-hidden="true">芽</span>
            <div><strong>芽芽為什麼推薦這一課</strong><p>{recommendationReason}</p></div>
          </div>
          <button className="english-primary-button" type="button" onClick={onStartLesson}>
            {lessonState.attempts > 0 ? studio.replayAction : studio.lessonAction} <ArrowRight aria-hidden="true" />
          </button>
        </div>

        <div className="english-hero-model" aria-label={studio.previewLabel}>
          <StudioPreview studio={studio} />
          <p>{studio.previewCaption}</p>
        </div>
      </section>

      <section className="english-home-details" aria-label="今天的學習內容">
        <div>
          <span className="english-section-label">這堂課怎麼進行</span>
          <ol>
            {studio.steps.map((step, index) => <li key={step}><strong>0{index + 1}</strong><span>{step}</span></li>)}
          </ol>
        </div>
        <aside>
          <span className="english-section-label">目前狀態</span>
          <strong>{Math.round(lessonState.mastery * 100)}%</strong>
          <p>{studio.masteryLabel}</p>
          <dl>
            <div><dt>練習</dt><dd>{lessonState.attempts} 次</dd></div>
            <div><dt>提示</dt><dd>{lessonState.hintCount} 次</dd></div>
            <div><dt>重試</dt><dd>{lessonState.retryCount} 次</dd></div>
          </dl>
          <button type="button" onClick={onShowGrowth}>查看 2D 成長路徑 <ArrowRight aria-hidden="true" /></button>
        </aside>
      </section>
    </main>
  );
}
