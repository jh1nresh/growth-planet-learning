import {Canvas, useFrame, useLoader, useThree} from '@react-three/fiber';
import {forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  MathUtils,
  PlaneGeometry,
  QuadraticBezierCurve3,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three';
import {getRegionDependencyEdges, getRegionStatus} from '../../lib/curriculum';
import type {Subject, WorldRegion} from '../../types';

const DESKTOP_ATLAS_ASPECT = 1536 / 1446;
const MOBILE_ATLAS_ASPECT = 1080 / 1547;
const CURVE_DEPTH = 0.18;
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
type AtlasDimensions = {width: number; height: number};

const desktopPoints: Record<string, AtlasPoint> = {
  counting_harbor: [0.34, 0.27],
  bundle_bridge: [0.41, 0.40],
  place_value_tower: [0.37, 0.60],
  compare_canyon: [0.62, 0.88],
  operations_forest: [0.29, 0.72],
  shape_workshop: [0.70, 0.15],
  measure_market: [0.76, 0.44],
  supply_station: [0.78, 0.73],
  english_first_dock: [0.70, 0.17],
};

const mobilePoints: Record<string, AtlasPoint> = {
  counting_harbor: [0.34, 0.29],
  bundle_bridge: [0.52, 0.41],
  place_value_tower: [0.48, 0.61],
  compare_canyon: [0.86, 0.91],
  operations_forest: [0.34, 0.73],
  shape_workshop: [0.79, 0.14],
  measure_market: [0.90, 0.50],
  supply_station: [0.90, 0.77],
  english_first_dock: [0.78, 0.15],
};

function getAtlasPosition(point: AtlasPoint, dimensions: AtlasDimensions, height = 0) {
  const [horizontal, vertical] = point;
  const normalizedX = (horizontal - 0.5) * 2;
  const normalizedY = (0.5 - vertical) * 2;
  const curvature = (Math.max(0, 1 - 0.55 * normalizedX ** 2 - 0.32 * normalizedY ** 2) - 0.5) * CURVE_DEPTH;
  return new Vector3(
    (horizontal - 0.5) * dimensions.width,
    (0.5 - vertical) * dimensions.height,
    curvature + height,
  );
}

function CurvedAtlas({portrait, dimensions}: {portrait: boolean; dimensions: AtlasDimensions}) {
  const texture = useLoader(TextureLoader, portrait ? '/assets/growth-planet-illustrated-atlas-mobile.webp' : '/assets/growth-planet-illustrated-atlas.webp');
  const geometry = useMemo(() => {
    const nextGeometry = new PlaneGeometry(dimensions.width, dimensions.height, 48, 48);
    const positions = nextGeometry.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      const normalizedX = positions.getX(index) / (dimensions.width / 2);
      const normalizedY = positions.getY(index) / (dimensions.height / 2);
      const curvature = (Math.max(0, 1 - 0.55 * normalizedX ** 2 - 0.32 * normalizedY ** 2) - 0.5) * CURVE_DEPTH;
      positions.setZ(index, curvature);
    }
    positions.needsUpdate = true;
    nextGeometry.computeVertexNormals();
    return nextGeometry;
  }, [dimensions.height, dimensions.width]);

  texture.colorSpace = SRGBColorSpace;

  return (
    <mesh geometry={geometry} renderOrder={0}>
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function StarField() {
  const geometry = useMemo(() => {
    const positions: number[] = [];

    for (let index = 0; index < 360; index += 1) {
      const radius = 10 + Math.random() * 14;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 14;
      positions.push(Math.cos(angle) * radius, height, Math.sin(angle) * radius - 8);
    }

    const nextGeometry = new BufferGeometry();
    nextGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return nextGeometry;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#dce8ef" size={0.035} transparent opacity={0.72} sizeAttenuation depthWrite={false} />
    </points>
  );
}

interface AtlasNodeProps {
  point: AtlasPoint;
  dimensions: AtlasDimensions;
  region: WorldRegion;
  selected: boolean;
  status: ReturnType<typeof getRegionStatus>;
  onSelect: () => void;
}

function AtlasNode({point, dimensions, region, selected, status, onSelect}: AtlasNodeProps) {
  const position = getAtlasPosition(point, dimensions, 0.11);
  const locked = status === 'locked' || status === 'coming-soon';
  const color = status === 'complete' ? '#b7e58d' : locked ? '#9ba5a7' : '#fff0a5';

  return (
    <group position={position} renderOrder={3}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <circleGeometry args={[0.15, 32]} />
        <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <sphereGeometry args={[selected ? 0.065 : 0.052, 20, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 1.25 : 0.48} roughness={0.42} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0, 0.02]} scale={selected ? 1.22 : 1}>
        <ringGeometry args={[selected ? 0.092 : 0.076, selected ? 0.118 : 0.094, 40]} />
        <meshBasicMaterial color={color} transparent opacity={locked ? 0.42 : 0.9} depthTest={false} depthWrite={false} />
      </mesh>
      {selected && <pointLight color={region.color} intensity={0.7} distance={0.8} decay={2} />}
    </group>
  );
}

function SkillEdge({
  source,
  target,
  selected,
  muted,
  active,
  hard,
}: {
  source: Vector3;
  target: Vector3;
  selected: boolean;
  muted: boolean;
  active: boolean;
  hard: boolean;
}) {
  const curve = useMemo(() => {
    const midpoint = source.clone().lerp(target, 0.5);
    midpoint.z += selected ? 0.24 : 0.16;
    return new QuadraticBezierCurve3(source, midpoint, target);
  }, [selected, source.x, source.y, source.z, target.x, target.y, target.z]);
  const color = active ? '#f7d77c' : hard ? '#87989b' : '#68777b';

  return (
    <mesh renderOrder={2}>
      <tubeGeometry args={[curve, 24, selected ? 0.009 : hard ? 0.0055 : 0.004, 5, false]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={selected ? 0.84 : muted ? 0.09 : active ? 0.42 : 0.2}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function FocusedAtlas({target, reducedMotion, children}: {target: Vector3; reducedMotion: boolean; children: ReactNode}) {
  const groupRef = useRef<Group>(null);
  const targetScale = target.lengthSq() > 0 ? 1.045 : 1;

  useEffect(() => {
    const group = groupRef.current;
    if (reducedMotion && group) {
      group.position.copy(target);
      group.scale.setScalar(targetScale);
    }
  }, [reducedMotion, target, targetScale]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || reducedMotion) return;
    group.position.x = MathUtils.damp(group.position.x, target.x, 16, delta);
    group.position.y = MathUtils.damp(group.position.y, target.y, 16, delta);
    group.position.z = MathUtils.damp(group.position.z, target.z, 16, delta);
    const scale = MathUtils.damp(group.scale.x, targetScale, 16, delta);
    group.scale.setScalar(scale);
  });

  return <group ref={groupRef}>{children}</group>;
}

function WorldScene({activeSubject, completedMissionIds, regions, selectedRegionId, onSelectRegion, reducedMotion, view}: SceneProps & {view: AtlasView}) {
  const {size, viewport} = useThree();
  const portrait = size.width / size.height < 0.82;
  const imageAspect = portrait ? MOBILE_ATLAS_ASPECT : DESKTOP_ATLAS_ASPECT;
  const viewportAspect = viewport.width / viewport.height;
  const dimensions = useMemo(() => imageAspect > viewportAspect
    ? {width: viewport.width, height: viewport.width / imageAspect}
    : {width: viewport.height * imageAspect, height: viewport.height}, [imageAspect, viewport.height, viewport.width, viewportAspect]);
  const points = portrait ? mobilePoints : desktopPoints;
  const visibleRegions = regions.filter((region) => region.subject === activeSubject && !region.comingSoon && points[region.id]);
  const regionById = new Map(visibleRegions.map((region) => [region.id, region]));
  const edges = getRegionDependencyEdges(activeSubject).filter((edge) => regionById.has(edge.sourceRegionId) && regionById.has(edge.targetRegionId));
  const rotationMultiplier = reducedMotion ? 0.9 : 1.7;
  const focusTarget = useMemo(() => {
    const point = selectedRegionId ? points[selectedRegionId] : null;
    if (!point) return new Vector3();
    const position = getAtlasPosition(point, dimensions);
    return new Vector3(position.x * -0.18, position.y * -0.18, 0);
  }, [dimensions, points, selectedRegionId]);

  return (
    <>
      <color attach="background" args={['#040b14']} />
      <ambientLight intensity={0.88} />
      <directionalLight position={[-3, 4, 6]} intensity={0.75} color="#ffe5ae" />
      <StarField />
      <group
        rotation={[view.polarOffset * -rotationMultiplier, view.azimuth * rotationMultiplier, 0]}
        scale={view.zoom}
      >
        <FocusedAtlas target={focusTarget} reducedMotion={reducedMotion}>
          <CurvedAtlas portrait={portrait} dimensions={dimensions} />
          {edges.map((edge) => {
            const sourcePoint = points[edge.sourceRegionId];
            const targetPoint = points[edge.targetRegionId];
            const sourceRegion = regionById.get(edge.sourceRegionId);
            const targetRegion = regionById.get(edge.targetRegionId);
            if (!sourcePoint || !targetPoint || !sourceRegion || !targetRegion) return null;
            const sourceStatus = getRegionStatus(sourceRegion, completedMissionIds);
            const targetStatus = getRegionStatus(targetRegion, completedMissionIds);
            return (
              <SkillEdge
                key={`${edge.sourceRegionId}-${edge.targetRegionId}`}
                source={getAtlasPosition(sourcePoint, dimensions, 0.1)}
                target={getAtlasPosition(targetPoint, dimensions, 0.1)}
                selected={edge.strength === 'hard' && (selectedRegionId === edge.sourceRegionId || selectedRegionId === edge.targetRegionId)}
                muted={Boolean(selectedRegionId) && selectedRegionId !== edge.sourceRegionId && selectedRegionId !== edge.targetRegionId}
                active={sourceStatus === 'complete' || targetStatus === 'available' || targetStatus === 'complete'}
                hard={edge.strength === 'hard'}
              />
            );
          })}
          {visibleRegions.map((region) => (
            <AtlasNode
              key={region.id}
              point={points[region.id]}
              dimensions={dimensions}
              region={region}
              selected={selectedRegionId === region.id}
              status={getRegionStatus(region, completedMissionIds)}
              onSelect={() => onSelectRegion(region.id)}
            />
          ))}
        </FocusedAtlas>
      </group>
    </>
  );
}

export const PlanetScene = forwardRef<PlanetControlsHandle, SceneProps>(function PlanetScene(props, ref) {
  const [view, setView] = useState<AtlasView>({azimuth: 0, polarOffset: 0, zoom: 1});
  const viewRef = useRef(view);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const pointersRef = useRef(new Map<number, {x: number; y: number}>());
  const gestureRef = useRef<{
    view: AtlasView;
    center: {x: number; y: number};
    distance: number;
  } | null>(null);

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
    pointersRef.current.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (pointersRef.current.size > 1) {
      draggingRef.current = true;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
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
    if (!draggingRef.current && Math.hypot(horizontalDelta, verticalDelta) < 8) return;
    if (!draggingRef.current) {
      draggingRef.current = true;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const pinchScale = gesture.distance > 0 && metrics.distance > 0 ? metrics.distance / gesture.distance : 1;
    commitView({
      azimuth: clamp(gesture.view.azimuth + horizontalDelta / 850, MIN_AZIMUTH, MAX_AZIMUTH),
      polarOffset: clamp(gesture.view.polarOffset + verticalDelta / 1100, MIN_POLAR_OFFSET, MAX_POLAR_OFFSET),
      zoom: clamp(gesture.view.zoom * pinchScale, MIN_ZOOM, MAX_ZOOM),
    });
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (pointersRef.current.size === 0) draggingRef.current = false;
    setDragging(draggingRef.current);
    restartGesture();
  };

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomFactor = Math.exp(-event.deltaY * 0.0012);
      adjustView((current) => ({...current, zoom: clamp(current.zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM)}));
    };
    element.addEventListener('wheel', handleWheel, {passive: false});
    return () => element.removeEventListener('wheel', handleWheel);
  }, []);

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
        ref={viewportRef}
        className={`illustrated-atlas-viewport${dragging ? ' is-dragging' : ''}`}
        onPointerDownCapture={handlePointerDown}
        onPointerMoveCapture={handlePointerMove}
        onPointerUpCapture={handlePointerEnd}
        onPointerCancelCapture={handlePointerEnd}
      >
        <Canvas
          frameloop="always"
          dpr={[1, 1.5]}
          camera={{position: [0, 0, 7], fov: 42, near: 0.1, far: 40}}
          gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
        >
          <WorldScene {...props} view={view} />
        </Canvas>
      </div>
    </div>
  );
});
