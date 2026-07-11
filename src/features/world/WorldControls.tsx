import {
  ArrowCounterClockwise,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowsOut,
  ArrowUp,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from '@phosphor-icons/react';
import type {RefObject} from 'react';
import type {PlanetControlsHandle} from './PlanetScene';

interface WorldControlsProps {
  controls: RefObject<PlanetControlsHandle | null>;
}

export function WorldControls({controls}: WorldControlsProps) {
  return (
    <div className="world-controls" aria-label="星球查看控制">
      <span className="world-controls-hint"><ArrowsOut aria-hidden="true" /> 拖曳旋轉 · 滾動縮放</span>
      <div className="world-control-buttons">
        <button type="button" aria-label="星球向左旋轉" onClick={() => controls.current?.rotateLeft()}><ArrowLeft aria-hidden="true" /></button>
        <button type="button" aria-label="星球向上旋轉" onClick={() => controls.current?.rotateUp()}><ArrowUp aria-hidden="true" /></button>
        <button type="button" aria-label="星球向下旋轉" onClick={() => controls.current?.rotateDown()}><ArrowDown aria-hidden="true" /></button>
        <button type="button" aria-label="星球向右旋轉" onClick={() => controls.current?.rotateRight()}><ArrowRight aria-hidden="true" /></button>
        <button type="button" aria-label="放大星球" onClick={() => controls.current?.zoomIn()}><MagnifyingGlassPlus aria-hidden="true" /></button>
        <button type="button" aria-label="縮小星球" onClick={() => controls.current?.zoomOut()}><MagnifyingGlassMinus aria-hidden="true" /></button>
        <button type="button" aria-label="重設星球視角" onClick={() => controls.current?.reset()}><ArrowCounterClockwise aria-hidden="true" /></button>
      </div>
    </div>
  );
}
