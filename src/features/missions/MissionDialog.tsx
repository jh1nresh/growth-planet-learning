import {useEffect, useState} from 'react';
import {ArrowRight, CheckCircle, Compass, Sparkle} from '@phosphor-icons/react';
import {Modal} from '../../components/Modal';
import type {Mission} from '../../types';

interface MissionDialogProps {
  mission: Mission | null;
  open: boolean;
  alreadyComplete: boolean;
  onClose: () => void;
  onComplete: (mission: Mission) => void;
}

export function MissionDialog({mission, open, alreadyComplete, onClose, onComplete}: MissionDialogProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuestionIndex(0);
    setSelectedOption(null);
    setChecked(false);
    setFinished(false);
  }, [mission?.id, open]);

  if (!mission) return null;
  const question = mission.questions[questionIndex];
  const correct = selectedOption === question.correctOption;
  const lastQuestion = questionIndex === mission.questions.length - 1;

  const continueMission = () => {
    if (!correct) {
      setChecked(false);
      setSelectedOption(null);
      return;
    }
    if (lastQuestion) {
      onComplete(mission);
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
          <h3>{alreadyComplete ? '再次完成探索' : '地標已點亮'}</h3>
          <p>{alreadyComplete ? '複習也會讓能力更穩固。' : `獲得 ${mission.xp} 點成長能量，下一個地標已準備好。`}</p>
          <button className="primary-button" type="button" onClick={onClose}>回到星球</button>
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
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className={`answer-feedback${checked ? ' is-visible' : ''}`} role="status" aria-live="polite">
            {checked ? (correct ? `答對了！${question.explanation}` : `再試一次。${question.explanation}`) : '選一個答案，再檢查看看。'}
          </div>
          {checked ? (
            <button className="primary-button" type="button" onClick={continueMission}>
              {correct ? (lastQuestion ? '完成任務' : '下一題') : '再試一次'}
              <ArrowRight aria-hidden="true" weight="bold" />
            </button>
          ) : (
            <button className="primary-button" type="button" disabled={!selectedOption} onClick={() => setChecked(true)}>
              檢查答案
            </button>
          )}
        </>
      )}
    </Modal>
  );
}
