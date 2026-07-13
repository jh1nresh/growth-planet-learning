import {useEffect, useRef, useState} from 'react';
import {Application, Container, FederatedPointerEvent, Graphics} from 'pixi.js';
import type {PlaceValueLessonContent} from '../../lib/lessonContent';

interface PlaceValueCanvasProps {
  tens: number;
  ones: number;
  onAddOne: () => void;
  labels: PlaceValueLessonContent['canvas'];
}

interface CanvasState {
  tens: number;
  ones: number;
}

const HEIGHT = 390;

function block(x: number, y: number, size: number, color = 0xe0b65f) {
  return new Graphics()
    .roundRect(x, y, size, size, 5)
    .fill({color})
    .stroke({color: 0xffe5a3, width: 2, alpha: 0.7});
}

function renderScene(app: Application, state: CanvasState, onAddOne: () => void) {
  const width = app.renderer.width / app.renderer.resolution;
  const stage = app.stage;
  for (const child of stage.removeChildren()) child.destroy({children: true});

  const compact = width < 520;
  const workX = compact ? 112 : Math.max(180, width * 0.28);
  const workWidth = width - workX - (compact ? 12 : 24);
  const panel = new Graphics()
    .roundRect(workX, 58, workWidth, 292, 22)
    .fill({color: 0x102a38, alpha: 0.92})
    .stroke({color: 0x5c8390, width: 1, alpha: 0.55});
  stage.addChild(panel);

  const source = new Container();
  source.x = compact ? 26 : 62;
  source.y = 118;
  source.eventMode = 'static';
  source.cursor = 'grab';
  source.hitArea = {contains: (x: number, y: number) => x >= -18 && x <= 74 && y >= -18 && y <= 74};
  source.addChild(block(0, 0, 54, 0x4ab0bd));
  source.addChild(new Graphics().moveTo(29, 14).lineTo(29, 40).stroke({color: 0xffffff, width: 4}));
  stage.addChild(source);

  let activePointer: number | null = null;
  const resetSource = () => {
    source.x = compact ? 26 : 62;
    source.y = 118;
    source.alpha = 1;
    source.cursor = 'grab';
  };
  source.on('pointerdown', (event: FederatedPointerEvent) => {
    if (activePointer !== null) return;
    activePointer = event.pointerId;
    source.alpha = 0.82;
    source.cursor = 'grabbing';
  });
  source.on('globalpointermove', (event: FederatedPointerEvent) => {
    if (activePointer !== event.pointerId) return;
    source.position.set(event.global.x - 27, event.global.y - 27);
    app.render();
  });
  const finishDrag = (event: FederatedPointerEvent) => {
    if (activePointer !== event.pointerId) return;
    const droppedInWorkArea = event.global.x >= workX && event.global.x <= width - 24
      && event.global.y >= 58 && event.global.y <= 350;
    activePointer = null;
    resetSource();
    if (droppedInWorkArea) onAddOne();
    else app.render();
  };
  source.on('pointerup', finishDrag);
  source.on('pointerupoutside', finishDrag);
  source.on('pointercancel', finishDrag);

  const tensStartX = workX + (compact ? 18 : 34);
  const towerWidth = compact ? 20 : 30;
  const towerGap = compact ? 26 : 42;
  for (let tenIndex = 0; tenIndex < state.tens; tenIndex += 1) {
    const x = tensStartX + tenIndex * towerGap;
    const tower = new Graphics()
      .roundRect(x, 96, towerWidth, 210, 7)
      .fill({color: 0xe0b65f})
      .stroke({color: 0xffe5a3, width: 2, alpha: 0.75});
    stage.addChild(tower);
    for (let lineIndex = 1; lineIndex < 10; lineIndex += 1) {
      stage.addChild(new Graphics().moveTo(x + 2, 96 + lineIndex * 21).lineTo(x + towerWidth - 2, 96 + lineIndex * 21).stroke({color: 0x6e5127, width: 1, alpha: 0.5}));
    }
  }

  const onesStartX = workX + workWidth * (compact ? 0.55 : 0.57);
  const columns = compact ? 3 : 4;
  const blockSize = compact ? 22 : Math.min(38, Math.max(26, workWidth * 0.09));
  for (let index = 0; index < state.ones; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    stage.addChild(block(onesStartX + column * (blockSize + (compact ? 4 : 8)), 104 + row * (blockSize + (compact ? 4 : 8)), blockSize, 0x2f8e9a));
  }

  app.render();
}

export function PlaceValueCanvas({tens, ones, onAddOne, labels}: PlaceValueCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const stateRef = useRef({tens, ones});
  const addOneRef = useRef(onAddOne);
  const [failed, setFailed] = useState(false);

  stateRef.current = {tens, ones};
  addOneRef.current = onAddOne;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    const app = new Application();
    const resize = () => {
      if (!app.renderer || disposed) return;
      const width = Math.max(320, Math.round(host.getBoundingClientRect().width));
      app.renderer.resize(width, HEIGHT);
      renderScene(app, stateRef.current, () => addOneRef.current());
    };
    const observer = new ResizeObserver(resize);

    void app.init({
      autoStart: false,
      width: Math.max(320, Math.round(host.getBoundingClientRect().width)),
      height: HEIGHT,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preference: 'webgl',
    }).then(() => {
      if (disposed) {
        app.destroy(true);
        return;
      }
      appRef.current = app;
      app.canvas.setAttribute('aria-hidden', 'true');
      app.canvas.style.width = '100%';
      app.canvas.style.height = `${HEIGHT}px`;
      app.canvas.style.touchAction = 'none';
      host.appendChild(app.canvas);
      observer.observe(host);
      resize();
    }).catch(() => {
      if (!disposed) setFailed(true);
    });

    return () => {
      disposed = true;
      observer.disconnect();
      if (appRef.current === app) appRef.current = null;
      if (app.renderer) app.destroy(true);
    };
  }, []);

  useEffect(() => {
    if (appRef.current) renderScene(appRef.current, {tens, ones}, () => addOneRef.current());
  }, [ones, tens]);

  if (failed) {
    return <div className="lesson-canvas-fallback" role="status">互動畫布暫時無法顯示，仍可使用下方按鈕完成課程。</div>;
  }
  return (
    <div className="place-value-canvas">
      <div ref={hostRef} className="place-value-canvas-host" />
      <div className="place-value-canvas-copy" aria-hidden="true">
        <div className="canvas-material-copy"><strong>{labels.materials}</strong><span>{labels.dragOne}</span></div>
        <div className="canvas-column-copy"><strong>{labels.tens}</strong><strong>{labels.ones}</strong></div>
        <div className="canvas-count-copy"><span>{tens} {labels.tenCount}</span><span>{ones} {labels.oneCount}</span></div>
      </div>
    </div>
  );
}
