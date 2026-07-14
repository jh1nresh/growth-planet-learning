import {describe, expect, it} from 'vitest';
import {getEnglishScenarioForTopic} from './englishCourse';
import {
  beginEnglishRoomRepeat,
  checkEnglishRoomPosition,
  finishEnglishRoomRepeat,
  finishEnglishRoomTurn,
  initialEnglishRoomLessonState,
  moveEnglishRoomBag,
  requestEnglishRoomHint,
  selectEnglishRoomToken,
} from './englishRoomLessonState';

const scenario = getEnglishScenarioForTopic('tw_eng_g1_prepositions')!;

describe('English room simulator lesson', () => {
  it('treats exploratory moves as free and retries only an incorrect check', () => {
    let state = initialEnglishRoomLessonState();
    state = moveEnglishRoomBag(state, 'on');
    expect(state).toMatchObject({bagPosition: 'on', retryCount: 0});

    state = checkEnglishRoomPosition(state);
    expect(state).toMatchObject({step: 'position', retryCount: 1, highlightedPosition: 'under'});

    state = moveEnglishRoomBag(state, 'next-to');
    expect(state).toMatchObject({bagPosition: 'next-to', retryCount: 1, highlightedPosition: null});
  });

  it('compares under with on before asking the child to read the scene', () => {
    let state = moveEnglishRoomBag(initialEnglishRoomLessonState(), 'under');
    state = checkEnglishRoomPosition(state);
    expect(state).toMatchObject({step: 'position', challengeIndex: 1, bagPosition: 'next-to'});

    state = moveEnglishRoomBag(state, 'on');
    state = checkEnglishRoomPosition(state);
    expect(state).toMatchObject({step: 'assemble', bagPosition: 'under'});
  });

  it('records position and token hints without revealing completion', () => {
    let state = requestEnglishRoomHint(initialEnglishRoomLessonState(), scenario);
    expect(state).toMatchObject({step: 'position', hintCount: 1, highlightedPosition: 'under'});

    state = moveEnglishRoomBag(state, 'under');
    state = checkEnglishRoomPosition(state);
    state = moveEnglishRoomBag(state, 'on');
    state = checkEnglishRoomPosition(state);
    state = requestEnglishRoomHint(state, scenario);
    expect(state).toMatchObject({step: 'assemble', hintCount: 2, highlightedToken: 'It'});
  });

  it('requires the exact sentence before the speaking and completion steps', () => {
    let state = moveEnglishRoomBag(initialEnglishRoomLessonState(), 'under');
    state = checkEnglishRoomPosition(state);
    state = moveEnglishRoomBag(state, 'on');
    state = checkEnglishRoomPosition(state);

    state = selectEnglishRoomToken(state, scenario, 'on');
    expect(state).toMatchObject({step: 'assemble', retryCount: 1, highlightedToken: 'It'});

    for (const token of scenario.tokens) state = selectEnglishRoomToken(state, scenario, token);
    expect(state.step).toBe('speak');

    state = finishEnglishRoomTurn(state);
    state = beginEnglishRoomRepeat(state);
    state = finishEnglishRoomRepeat(state);
    expect(state).toMatchObject({step: 'complete', retryCount: 1});
  });
});
