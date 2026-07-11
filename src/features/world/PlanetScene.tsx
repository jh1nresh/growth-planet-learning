import {Canvas, useThree} from '@react-three/fiber';
import {Stars} from '@react-three/drei';
import {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import type {CSSProperties, PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent} from 'react';
import {getRegionStatus} from '../../lib/curriculum';
import type {Subject, WorldRegion} from '../../types';

const ATLAS_HEIGHT = 5.35;
const DESKTOP_ATLAS_ASPECT = 1536 / 1446;
const MOBILE_ATLAS_ASPECT = 1080 / 1547;
const MIN_AZIMUTH = -0.24;
const MAX_AZIMUTH = 0.24;
const MIN_POLAR_OFFSET = -0.15;
const MAX_POLAR_OFFSET = 0.15;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 1.25;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export interface PlanetControlsHandle {
  rotateLeft: () => void;
  rotateRight: () => void;
  rotateUp: () => void;
  rotateDown: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

interface SceneProps {
  activeSubject: Subject;
  completedMissionIds: Set<string>;
  regions: WorldRegion[];
  selectedRegionId: string | null;
  onSelectRegion: (regionId: string) => void;
  reducedMotion: boolean;
}

interface AtlasView {
  azimuth: number;
  polarOffset: number;
  zoom: number;
}

type AtlasPoint = readonly [number, number];

const desktopPoints: Record<string, AtlasPoint> = {
  counting_harbor: [0.34, 0.27],
  bundle_bridge: [0.41, 0.40],
  place_value_tower: [0.37, 0.60],
  compare_canyon: [0.62, 0.88],
  operations_forest: [0.29, 0.72],
  shapes_workshop: [0.70, 0.15],
  measurement_market: [0.76, 0.44],
  math_supply_station: [0.78, 0.73],
  english_first_dock: [0.70, 0.17],
};

const mobilePoints: Record<string, AtlasPoint> = {
  counting_harbor: [0.34, 0.29],
  bundle_bridge: [0.52, 0.41],
  place_value_tower: [0.48, 0.61],
  compare_canyon: [0.86, 0.91],
  operations_forest: [0.34, 0.73],
  shapes_workshop: [0.79, 0.14],
  measurement_market: [0.90, 0.50],
  math_supply_station: [0.90, 0.77],
  english_first_dock: [0.78, 0.15],
};

interface AtlasMarkerProps {
  portrait: boolean;
  region: WorldRegion;
  selected: boolean;
  status: ReturnType<typeof getRegionStatus>;
  onSelect: () => void;
}

function AtlasMarker({portrait, region, selected, status, onSelect}: AtlasMarkerProps) {
  const points = portrait ? mobilePoints : desktopPoints;
  const point = points[region.id];
  if (!point) return null;

  const aspect = portrait ? MOBILE_ATLAS_ASPECT : DESKTOP_ATLAS_ASPECT;
  const width = ATLAS_HEIGHT * aspect;
  const [horizontal, vertical] = point;
  const position: [number, number, number] = [
    (horizontal - 0.5) * width,
    (0.5 - vertical) * ATLAS_HEIGHT,
    0.12,
  ];
  const locked = status === 'locked' || status === 'coming-soon';
  const color = status === 'complete' ? '#b7e58d' : locked ? '#9ba5a7' : '#fff0a5';

  return (
    <group position={position}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        scale={selected ? 1.12 : 1}
      >
        <ringGeometry args={[selected ? 0.075 : 0.052, selected ? 0.108 : 0.076, 32]} />
        <meshBasicMaterial color={color} transparent opacity={locked ? 0.58 : 0.96} depthTest={false} />
      </mesh>
    </group>
  );
}

function WorldScene({activeSubject, completedMissionIds, regions, selectedRegionId, onSelectRegion}: SceneProps) {
  const {size} = useThree();
  const portrait = size.width / size.height < 0.82;
  const visibleRegions = regions.filter((region) => region.subject === activeSubject && !region.comingSoon);

  return (
    <>
      <ambientLight intensity={0.55} />
      <Stars radius={24} depth={14} count={420} factor={1.5} saturation={0.15} fade speed={0} />
      {visibleRegions.map((region) => (
        <AtlasMarker
          key={region.id}
          portrait={portrait}
          region={region}
          selected={selectedRegionId === region.id}
          status={getRegionStatus(region, completedMissionIds)}
          onSelect={() => onSelectRegion(region.id)}
        />
      ))}
    </>
  );
}

export const PlanetScene = forwardRef<PlanetControlsHandle, SceneProps>(function PlanetScene(props, ref) {
  const [view, setView] = useState<AtlasView>({azimuth: 0, polarOffset: 0, zoom: 1});
  const viewRef = useRef(view);
  const [dragging, setDragging] = useState(false);
  const pointersRef = useRef(new Map<number, {x: number; y: number}>());
  const gestureRef = useRef<{
    view: AtlasView;
    center: {x: number; y: number};
    distance: number;
  } | null>(null);
  const tiltMultiplier = props.reducedMotion ? 18 : 30;
  const atlasStyle: CSSProperties = {
    transform: `perspective(1100px) rotateX(${view.polarOffset * -tiltMultiplier}deg) rotateY(${view.azimuth * tiltMultiplier}deg) scale(${view.zoom})`,
  };

  const commitView = (nextView: AtlasView) => {
    viewRef.current = nextView;
    setView(nextView);
  };

  const adjustView = (updater: (current: AtlasView) => AtlasView) => {
    commitView(updater(viewRef.current));
  };

  const gestureMetrics = () => {
    const points = [...pointersRef.current.values()];
    const first = points[0];
    const second = points[1];
    if (!first) return null;
    if (!second) return {center: first, distance: 0};
    return {
      center: {x: (first.x + second.x) / 2, y: (first.y + second.y) / 2},
      distance: Math.hypot(second.x - first.x, second.y - first.y),
    };
  };

  const restartGesture = () => {
    const metrics = gestureMetrics();
    gestureRef.current = metrics ? {view: viewRef.current, ...metrics} : null;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {x: event.clientX, y: event.clientY});
    setDragging(true);
    restartGesture();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, {x: event.clientX, y: event.clientY});
    const gesture = gestureRef.current;
    const metrics = gestureMetrics();
    if (!gesture || !metrics) return;

    const horizontalDelta = metrics.center.x - gesture.center.x;
    const verticalDelta = metrics.center.y - gesture.center.y;
    const pinchScale = gesture.distance > 0 && metrics.distance > 0 ? metrics.distance / gesture.distance : 1;
    commitView({
      azimuth: clamp(gesture.view.azimuth + horizontalDelta / 850, MIN_AZIMUTH, MAX_AZIMUTH),
      polarOffset: clamp(gesture.view.polarOffset + verticalDelta / 1100, MIN_POLAR_OFFSET, MAX_POLAR_OFFSET),
      zoom: clamp(gesture.view.zoom * pinchScale, MIN_ZOOM, MAX_ZOOM),
    });
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(pointersRef.current.size > 0);
    restartGesture();
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const zoomFactor = Math.exp(-event.deltaY * 0.0012);
    adjustView((current) => ({
      ...current,
      zoom: clamp(current.zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM),
    }));
  };

  useImperativeHandle(ref, () => ({
    rotateLeft: () => adjustView((current) => ({...current, azimuth: clamp(current.azimuth - 0.055, MIN_AZIMUTH, MAX_AZIMUTH)})),
    rotateRight: () => adjustView((current) => ({...current, azimuth: clamp(current.azimuth + 0.055, MIN_AZIMUTH, MAX_AZIMUTH)})),
    rotateUp: () => adjustView((current) => ({...current, polarOffset: clamp(current.polarOffset - 0.045, MIN_POLAR_OFFSET, MAX_POLAR_OFFSET)})),
    rotateDown: () => adjustView((current) => ({...current, polarOffset: clamp(current.polarOffset + 0.045, MIN_POLAR_OFFSET, MAX_POLAR_OFFSET)})),
    zoomIn: () => adjustView((current) => ({...current, zoom: clamp(current.zoom * 1.1, MIN_ZOOM, MAX_ZOOM)})),
    zoomOut: () => adjustView((current) => ({...current, zoom: clamp(current.zoom / 1.1, MIN_ZOOM, MAX_ZOOM)})),
    reset: () => commitView({azimuth: 0, polarOffset: 0, zoom: 1}),
  }), []);

  return (
    <div className="planet-canvas" aria-hidden="true">
      <div
        className={`illustrated-atlas-viewport${dragging ? ' is-dragging' : ''}`}
        style={atlasStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onWheel={handleWheel}
      >
        <picture className="illustrated-atlas-art">
          <source media="(max-width: 760px)" srcSet="/assets/growth-planet-illustrated-atlas-mobile.jpg" />
          <img src="/assets/growth-planet-illustrated-atlas.jpg" alt="" draggable="false" />
        </picture>
        <Canvas
          frameloop="demand"
          dpr={[1, 1.5]}
          camera={{position: [0, 0, 7], fov: 42, near: 0.1, far: 40}}
          gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}}
        >
          <WorldScene {...props} />
        </Canvas>
      </div>
    </div>
  );
});
