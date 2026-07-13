import {useEffect, useState} from 'react';
import {ArrowRight, CheckCircle, Compass, Lightbulb, Sparkle} from '@phosphor-icons/react';
import {Modal} from '../../components/Modal';
import {appendTutorEvent, getTutorMove, type TutorEvent} from '../../lib/tutor';
import type {Mission} from '../../types';

interface MissionDialogProps {
  mission: Mission | null;
  open: boolean;
  alreadyComplete: boolean;
  onClose: () => void;
  onComplete: (mission: Mission, summary: {hintCount: number; retryCount: number}) => void;
}

export function MissionDialog({mission, open, alreadyComplete, onClose, onComplete}: MissionDialogProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [events, setEvents] = useState<TutorEvent[]>([]);
  const [wasAlreadyComplete, setWasAlreadyComplete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuestionIndex(0);
    setSelectedOption(null);
    setChecked(false);
    setFinished(false);
    setEvents([]);
    setWasAlreadyComplete(alreadyComplete);
  }, [mission?.id, open]);

  if (!mission) return null;
  const question = mission.questions[questionIndex] ?? mission.questions[0];
  const correct = selectedOption === question.correctOption;
  const lastQuestion = questionIndex === mission.questions.length - 1;
  const tutorMove = getTutorMove(question, events, selectedOption, checked);

  const appendEvent = (event: TutorEvent) => {
    setEvents((current) => appendTutorEvent(current, event));
  };

  const checkAnswer = () => {
    if (!selectedOption) return;
    appendEvent({
      type: 'answer-checked',
      questionId: question.id,
      correct,
      occurredAt: new Date().toISOString(),
    });
    setChecked(true);
  };

  const continueMission = () => {
    if (!correct) {
      setChecked(false);
      setSelectedOption(null);
      return;
    }
    if (lastQuestion) {
      onComplete(mission, {
        hintCount: events.filter((event) => event.type === 'hint-requested').length,
        retryCount: events.filter((event) => event.type === 'answer-checked' && !event.correct).length,
      });
      setFinished(true);
      return;
    }
    setQuestionIndex((index) => index + 1);
    setSelectedOption(null);
    setChecked(false);
  };

  return (
    <Modal open={open} title={mission.title} onClose={onClose} className="mission-modal">
      {finished ? (
        <section className="mission-success" aria-live="polite">
          <CheckCircle aria-hidden="true" weight="fill" />
          <h3>{wasAlreadyComplete ? '再次完成探索' : '這一課完成了'}</h3>
          <p>{wasAlreadyComplete ? '複習也會讓能力更穩固。' : `獲得 ${mission.xp} 點成長能量，芽芽正在計算下一課。`}</p>
          <button className="primary-button" type="button" onClick={onClose}>回到今天</button>
        </section>
      ) : (
        <>
          <div className="mission-meta">
            <span><Compass aria-hidden="true" /> 第 {questionIndex + 1} 題／共 {mission.questions.length} 題</span>
            <span><Sparkle aria-hidden="true" /> {mission.xp} 點能量</span>
          </div>
          <div className="mission-progress" aria-hidden="true">
            <span style={{width: `${((questionIndex + 1) / mission.questions.length) * 100}%`}} />
          </div>
          <fieldset className="question-fieldset">
            <legend>{question.prompt}</legend>
            <div className="answer-list">
              {question.options.map((option) => {
                const selected = selectedOption === option;
                const state = checked && selected ? (correct ? 'correct' : 'incorrect') : selected ? 'selected' : 'idle';
                return (
                  <button
                    key={option}
                    className={`answer-option answer-option-${state}`}
                    type="button"
                    aria-pressed={selected}
                    disabled={checked && correct}
                    onClick={() => {
                      setSelectedOption(option);
                      setChecked(false);
                      appendEvent({
                        type: 'option-selected',
                        questionId: question.id,
                        option,
                        occurredAt: new Date().toISOString(),
                      });
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <section className={`tutor-guidance tutor-guidance-${tutorMove.kind}`} aria-label="AI 導航員提示">
            <span className="tutor-avatar" aria-hidden="true">芽</span>
            <div>
              <strong>芽芽導航員</strong>
              <p role="status" aria-live="polite">{tutorMove.message}</p>
            </div>
          </section>
          {!checked ? (
            <button
              className="hint-button"
              type="button"
              onClick={() => appendEvent({type: 'hint-requested', questionId: question.id, occurredAt: new Date().toISOString()})}
            >
              <Lightbulb aria-hidden="true" /> 給我一點提示
            </button>
          ) : null}
          {checked ? (
            <button className="primary-button" type="button" onClick={continueMission}>
              {correct ? (lastQuestion ? '完成任務' : '下一題') : '再試一次'}
              <ArrowRight aria-hidden="true" weight="bold" />
            </button>
          ) : (
            <button className="primary-button" type="button" disabled={!selectedOption} onClick={checkAnswer}>
              檢查答案
            </button>
          )}
        </>
      )}
    </Modal>
  );
}
