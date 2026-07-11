import {Canvas, useLoader, useThree} from '@react-three/fiber';
import {forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
import {
  BackSide,
  BufferGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  Quaternion,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three';
import {getRegionDependencyEdges, getRegionStatus} from '../../lib/curriculum';
import type {Subject, WorldRegion} from '../../types';
import {getGreatCirclePoints, latLonToVector3} from './globeMath';

const MAX_PITCH = 1.18;
const MIN_ZOOM = 0.72;
const MAX_ZOOM = 1.42;
const CONTROL_ROTATION_STEP = Math.PI / 12;
const DEG_TO_RAD = Math.PI / 180;
const SURFACE_NORMAL = new Vector3(0, 0, 1);

const globeVertexShader = `
  varying vec3 vObjectNormal;
  varying vec3 vWorldNormal;

  void main() {
    vObjectNormal = normalize(normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const globeFragmentShader = `
  uniform sampler2D uAtlas;
  uniform vec3 uLightDirection;
  varying vec3 vObjectNormal;
  varying vec3 vWorldNormal;

  void main() {
    vec3 normal = normalize(vObjectNormal);
    vec2 atlasUv = vec2(0.5 + normal.x * 0.5, 0.5 + normal.y * 0.5);
    vec3 illustrated = texture2D(uAtlas, atlasUv).rgb;

    float terrainNoise = sin(normal.x * 9.0 + sin(normal.y * 6.0))
      + sin(normal.z * 11.0 - normal.y * 4.0) * 0.65
      + sin((normal.x + normal.z) * 17.0) * 0.28;
    float land = smoothstep(0.28, 0.72, terrainNoise);
    vec3 ocean = mix(vec3(0.025, 0.18, 0.29), vec3(0.04, 0.34, 0.43), normal.y * 0.5 + 0.5);
    vec3 earth = mix(ocean, vec3(0.20, 0.39, 0.17), land * 0.84);
    earth = mix(earth, vec3(0.72, 0.78, 0.66), land * smoothstep(0.56, 0.9, abs(normal.y)));

    float illustrationMask = smoothstep(0.08, 0.48, normal.z);
    vec3 surface = mix(earth, illustrated, illustrationMask);
    float light = 0.48 + max(dot(normalize(vWorldNormal), normalize(uLightDirection)), 0.0) * 0.58;
    float rim = pow(1.0 - max(normal.z, 0.0), 2.4) * 0.12;
    gl_FragColor = vec4(surface * light + vec3(0.08, 0.22, 0.27) * rim, 1.0);
  }
`;

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
}

interface GlobeView {
  yaw: number;
  pitch: number;
  zoom: number;
}

function GlobeSurface({radius}: {radius: number}) {
  const texture = useLoader(TextureLoader, '/assets/growth-planet-illustrated-atlas.webp');
  const {invalidate} = useThree();
  texture.colorSpace = SRGBColorSpace;
  const uniforms = useMemo(() => ({
    uAtlas: {value: texture},
    uLightDirection: {value: new Vector3(-0.45, 0.62, 0.78).normalize()},
  }), [texture]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(frame);
  }, [invalidate, texture]);

  return (
    <>
      <mesh renderOrder={0}>
        <sphereGeometry args={[radius, 96, 64]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={globeVertexShader}
          fragmentShader={globeFragmentShader}
        />
      </mesh>
      <mesh scale={1.045} renderOrder={4}>
        <sphereGeometry args={[radius, 64, 40]} />
        <meshBasicMaterial
          side={BackSide}
          color="#67d5ec"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

function StarField() {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    for (let index = 0; index < 340; index += 1) {
      const radius = 10 + Math.random() * 14;
      const angle = Math.random() * Math.PI * 2;
      positions.push(Math.cos(angle) * radius, (Math.random() - 0.5) * 14, Math.sin(angle) * radius - 8);
    }
    const nextGeometry = new BufferGeometry();
    nextGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return nextGeometry;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#dce8ef" size={0.035} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function GlobeNode({
  radius,
  region,
  selected,
  status,
  onSelect,
}: {
  radius: number;
  region: WorldRegion;
  selected: boolean;
  status: ReturnType<typeof getRegionStatus>;
  onSelect: () => void;
}) {
  const normal = useMemo(() => latLonToVector3(region.latitude, region.longitude, 1), [region.latitude, region.longitude]);
  const position = useMemo(() => normal.clone().multiplyScalar(radius + 0.045), [normal, radius]);
  const orientation = useMemo(() => new Quaternion().setFromUnitVectors(SURFACE_NORMAL, normal), [normal]);
  const locked = status === 'locked' || status === 'coming-soon';
  const color = status === 'complete' ? '#b7e58d' : locked ? '#9ba5a7' : '#fff0a5';

  return (
    <group position={position} quaternion={orientation} renderOrder={3}>
      <mesh
        position={[0, 0, 0.025]}
        onClick={(event) => {
          event.stopPropagation();
          if (event.delta <= 8) onSelect();
        }}
      >
        <circleGeometry args={[0.15, 32]} />
        <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <sphereGeometry args={[selected ? 0.068 : 0.052, 20, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 1.35 : 0.52} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.04]} scale={selected ? 1.2 : 1}>
        <ringGeometry args={[selected ? 0.092 : 0.076, selected ? 0.12 : 0.096, 40]} />
        <meshBasicMaterial color={color} transparent opacity={locked ? 0.42 : 0.92} depthWrite={false} />
      </mesh>
      {selected && (
        <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.045, 0.14, 6]} />
          <meshStandardMaterial color={region.color} emissive={region.color} emissiveIntensity={0.65} />
        </mesh>
      )}
    </group>
  );
}

function SkillEdge({
  radius,
  source,
  target,
  selected,
  muted,
  active,
  hard,
}: {
  radius: number;
  source: WorldRegion;
  target: WorldRegion;
  selected: boolean;
  muted: boolean;
  active: boolean;
  hard: boolean;
}) {
  const curve = useMemo(() => {
    const sourcePosition = latLonToVector3(source.latitude, source.longitude, radius);
    const targetPosition = latLonToVector3(target.latitude, target.longitude, radius);
    return new CatmullRomCurve3(getGreatCirclePoints(sourcePosition, targetPosition, radius + 0.025, 28));
  }, [radius, source.latitude, source.longitude, target.latitude, target.longitude]);
  const color = active ? '#f7d77c' : hard ? '#9ba8a5' : '#718184';

  return (
    <mesh renderOrder={2}>
      <tubeGeometry args={[curve, 28, selected ? 0.012 : hard ? 0.007 : 0.005, 5, false]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={selected ? 0.96 : muted ? 0.08 : active ? 0.5 : 0.24}
        depthWrite={false}
      />
    </mesh>
  );
}

function WorldScene({activeSubject, completedMissionIds, regions, selectedRegionId, onSelectRegion, view}: SceneProps & {view: GlobeView}) {
  const {viewport} = useThree();
  const globeRadius = Math.min(2.15, viewport.width * 0.43, viewport.height * 0.42);
  const visibleRegions = regions.filter((region) => region.subject === activeSubject && !region.comingSoon);
  const regionById = new Map(visibleRegions.map((region) => [region.id, region]));
  const edges = getRegionDependencyEdges(activeSubject).filter((edge) => regionById.has(edge.sourceRegionId) && regionById.has(edge.targetRegionId));

  return (
    <>
      <color attach="background" args={['#040b14']} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[-3, 4, 6]} intensity={1.05} color="#ffe5ae" />
      <StarField />
      <group rotation={[view.pitch, view.yaw, 0]} scale={view.zoom}>
        <GlobeSurface radius={globeRadius} />
        {edges.map((edge) => {
          const source = regionById.get(edge.sourceRegionId);
          const target = regionById.get(edge.targetRegionId);
          if (!source || !target) return null;
          const sourceStatus = getRegionStatus(source, completedMissionIds);
          const targetStatus = getRegionStatus(target, completedMissionIds);
          return (
            <SkillEdge
              key={`${edge.sourceRegionId}-${edge.targetRegionId}`}
              radius={globeRadius}
              source={source}
              target={target}
              selected={edge.strength === 'hard' && (selectedRegionId === source.id || selectedRegionId === target.id)}
              muted={Boolean(selectedRegionId) && selectedRegionId !== source.id && selectedRegionId !== target.id}
              active={sourceStatus === 'complete' || targetStatus === 'available' || targetStatus === 'complete'}
              hard={edge.strength === 'hard'}
            />
          );
        })}
        {visibleRegions.map((region) => (
          <GlobeNode
            key={region.id}
            radius={globeRadius}
            region={region}
            selected={selectedRegionId === region.id}
            status={getRegionStatus(region, completedMissionIds)}
            onSelect={() => onSelectRegion(region.id)}
          />
        ))}
      </group>
    </>
  );
}

export const PlanetScene = forwardRef<PlanetControlsHandle, SceneProps>(function PlanetScene(props, ref) {
  const [view, setView] = useState<GlobeView>({yaw: 0, pitch: 0, zoom: 1});
  const viewRef = useRef(view);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const pointersRef = useRef(new Map<number, {x: number; y: number}>());
  const gestureRef = useRef<{
    view: GlobeView;
    center: {x: number; y: number};
    distance: number;
  } | null>(null);

  const commitView = (nextView: GlobeView) => {
    viewRef.current = nextView;
    setView(nextView);
  };

  const adjustView = (updater: (current: GlobeView) => GlobeView) => {
    commitView(updater(viewRef.current));
  };

  useEffect(() => {
    const selected = props.regions.find((region) => region.id === props.selectedRegionId);
    if (!selected) return;
    adjustView((current) => ({
      ...current,
      yaw: -selected.longitude * DEG_TO_RAD,
      pitch: clamp(selected.latitude * DEG_TO_RAD, -MAX_PITCH, MAX_PITCH),
    }));
  }, [props.regions, props.selectedRegionId]);

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
      yaw: gesture.view.yaw + horizontalDelta * 0.008,
      pitch: clamp(gesture.view.pitch + verticalDelta * 0.006, -MAX_PITCH, MAX_PITCH),
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
    rotateLeft: () => adjustView((current) => ({...current, yaw: current.yaw - CONTROL_ROTATION_STEP})),
    rotateRight: () => adjustView((current) => ({...current, yaw: current.yaw + CONTROL_ROTATION_STEP})),
    rotateUp: () => adjustView((current) => ({...current, pitch: clamp(current.pitch - CONTROL_ROTATION_STEP, -MAX_PITCH, MAX_PITCH)})),
    rotateDown: () => adjustView((current) => ({...current, pitch: clamp(current.pitch + CONTROL_ROTATION_STEP, -MAX_PITCH, MAX_PITCH)})),
    zoomIn: () => adjustView((current) => ({...current, zoom: clamp(current.zoom * 1.1, MIN_ZOOM, MAX_ZOOM)})),
    zoomOut: () => adjustView((current) => ({...current, zoom: clamp(current.zoom / 1.1, MIN_ZOOM, MAX_ZOOM)})),
    reset: () => commitView({yaw: 0, pitch: 0, zoom: 1}),
  }), []);

  return (
    <div className="planet-canvas" aria-hidden="true">
      <div
        ref={viewportRef}
        className={`illustrated-atlas-viewport${dragging ? ' is-dragging' : ''}`}
        data-globe-yaw={view.yaw.toFixed(3)}
        data-globe-pitch={view.pitch.toFixed(3)}
        data-globe-zoom={view.zoom.toFixed(3)}
        onPointerDownCapture={handlePointerDown}
        onPointerMoveCapture={handlePointerMove}
        onPointerUpCapture={handlePointerEnd}
        onPointerCancelCapture={handlePointerEnd}
      >
        <Canvas
          frameloop="demand"
          dpr={[1, 1.5]}
          camera={{position: [0, 0, 7], fov: 42, near: 0.1, far: 40}}
          gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
          onCreated={({invalidate}) => invalidate()}
        >
          <WorldScene {...props} view={view} />
        </Canvas>
      </div>
    </div>
  );
});
