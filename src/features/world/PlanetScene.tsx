import {Canvas, useThree} from '@react-three/fiber';
import {Html, OrbitControls, Stars} from '@react-three/drei';
import {forwardRef, useImperativeHandle, useMemo, useRef} from 'react';
import type {Ref} from 'react';
import {Color, MathUtils, Quaternion, Vector3} from 'three';
import {getRegionStatus} from '../../lib/curriculum';
import type {Subject, WorldRegion} from '../../types';

const PLANET_RADIUS = 2.28;

export interface PlanetControlsHandle {
  rotateLeft: () => void;
  rotateRight: () => void;
  rotateUp: () => void;
  rotateDown: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

interface OrbitApi {
  getAzimuthalAngle: () => number;
  getPolarAngle: () => number;
  setAzimuthalAngle: (angle: number) => void;
  setPolarAngle: (angle: number) => void;
  reset: () => void;
  update: () => void;
}

interface SceneProps {
  activeSubject: Subject;
  completedMissionIds: Set<string>;
  regions: WorldRegion[];
  selectedRegionId: string | null;
  onSelectRegion: (regionId: string) => void;
  reducedMotion: boolean;
}

function latLonVector(latitude: number, longitude: number, radius = PLANET_RADIUS) {
  const phi = MathUtils.degToRad(90 - latitude);
  const theta = MathUtils.degToRad(longitude + 180);
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function surfaceTransform(latitude: number, longitude: number, radius = PLANET_RADIUS) {
  const position = latLonVector(latitude, longitude, radius);
  const normal = position.clone().normalize();
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal);
  return {position, quaternion};
}

interface LandMassProps {
  latitude: number;
  longitude: number;
  color: string;
  scale: number;
  pieces: Array<[number, number, number]>;
}

function LandMass({latitude, longitude, color, scale, pieces}: LandMassProps) {
  const transform = useMemo(() => surfaceTransform(latitude, longitude, PLANET_RADIUS - 0.03), [latitude, longitude]);
  return (
    <group position={transform.position} quaternion={transform.quaternion}>
      {pieces.map(([x, y, size], index) => (
        <mesh key={`${x}-${y}-${index}`} position={[x * scale, y * scale, 0.05]} scale={[size * scale, size * scale * 0.82, 0.22]}>
          <dodecahedronGeometry args={[0.52, 0]} />
          <meshStandardMaterial color={color} roughness={0.9} metalness={0.02} />
        </mesh>
      ))}
    </group>
  );
}

function LandmarkModel({status, color}: {status: ReturnType<typeof getRegionStatus>; color: string}) {
  const active = status === 'available';
  const complete = status === 'complete';
  const base = complete ? '#82d68b' : active ? color : '#6f7476';
  return (
    <group>
      <mesh position={[0, 0, 0.07]}>
        <cylinderGeometry args={[0.08, 0.12, 0.18, 8]} />
        <meshStandardMaterial color={base} roughness={0.55} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.03, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.11, 0.18, 8]} />
        <meshStandardMaterial color={complete ? '#d9f59d' : '#f3ce71'} roughness={0.48} />
      </mesh>
    </group>
  );
}

interface RegionMarkerProps {
  region: WorldRegion;
  selected: boolean;
  status: ReturnType<typeof getRegionStatus>;
  onSelect: () => void;
}

function RegionMarker({region, selected, status, onSelect}: RegionMarkerProps) {
  const transform = useMemo(() => surfaceTransform(region.latitude, region.longitude, PLANET_RADIUS + 0.08), [region.latitude, region.longitude]);
  const disabled = status === 'locked' || status === 'coming-soon';
  return (
    <group position={transform.position} quaternion={transform.quaternion}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        scale={selected ? 1.22 : 1}
      >
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshStandardMaterial
          color={disabled ? '#5f6768' : region.color}
          emissive={new Color(selected ? region.color : '#000000')}
          emissiveIntensity={selected ? 0.55 : 0}
          roughness={0.4}
        />
      </mesh>
      <LandmarkModel status={status} color={region.color} />
      <Html center distanceFactor={7.6} position={[0, 0.42, 0.16]} occlude>
        <div
          className={`world-label world-label-${status}${selected ? ' is-selected' : ''}`}
          aria-hidden="true"
          onClick={onSelect}
        >
          <span>{region.shortName}</span>
          <small>{status === 'complete' ? '完成' : status === 'available' ? '探索' : status === 'coming-soon' ? '即將開放' : '鎖定'}</small>
        </div>
      </Html>
    </group>
  );
}

function CameraControls({controlsHandle, reducedMotion}: {controlsHandle: Ref<PlanetControlsHandle>; reducedMotion: boolean}) {
  const controlsRef = useRef<OrbitApi | null>(null);
  const {camera, invalidate} = useThree();

  const rotate = (azimuthDelta: number, polarDelta: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.setAzimuthalAngle(controls.getAzimuthalAngle() + azimuthDelta);
    controls.setPolarAngle(MathUtils.clamp(controls.getPolarAngle() + polarDelta, 0.38, Math.PI - 0.38));
    controls.update();
    invalidate();
  };

  const zoom = (factor: number) => {
    const distance = MathUtils.clamp(camera.position.length() * factor, 4.2, 8.4);
    camera.position.setLength(distance);
    camera.updateProjectionMatrix();
    invalidate();
  };

  useImperativeHandle(controlsHandle, () => ({
    rotateLeft: () => rotate(-0.28, 0),
    rotateRight: () => rotate(0.28, 0),
    rotateUp: () => rotate(0, -0.22),
    rotateDown: () => rotate(0, 0.22),
    zoomIn: () => zoom(0.88),
    zoomOut: () => zoom(1.12),
    reset: () => {
      controlsRef.current?.reset();
      invalidate();
    },
  }), [camera, invalidate]);

  return (
    <OrbitControls
      ref={(instance) => { controlsRef.current = instance as unknown as OrbitApi; }}
      makeDefault
      enableDamping={false}
      enablePan={false}
      minDistance={4.2}
      maxDistance={8.4}
      minPolarAngle={0.38}
      maxPolarAngle={Math.PI - 0.38}
      rotateSpeed={reducedMotion ? 0.55 : 0.72}
      zoomSpeed={0.72}
    />
  );
}

function WorldScene({activeSubject, completedMissionIds, regions, selectedRegionId, onSelectRegion, reducedMotion, controlsHandle}: SceneProps & {controlsHandle: Ref<PlanetControlsHandle>}) {
  const visibleRegions = regions.filter((region) => region.subject === activeSubject || region.comingSoon);
  const mathPieces: Array<[number, number, number]> = [[0, 0, 1.2], [-0.48, 0.14, 0.9], [0.43, 0.18, 0.82], [-0.18, -0.42, 0.95], [0.48, -0.34, 0.72]];
  const englishPieces: Array<[number, number, number]> = [[0, 0, 0.78], [0.35, -0.08, 0.5], [-0.3, 0.12, 0.46]];
  const futurePieces: Array<[number, number, number]> = [[0, 0, 0.9], [0.4, 0.1, 0.54], [-0.34, -0.14, 0.58]];

  return (
    <>
      <color attach="background" args={['#07111f']} />
      <fog attach="fog" args={['#07111f', 8, 14]} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[-4, 5, 6]} intensity={2.4} color="#ffe0a2" />
      <directionalLight position={[5, -2, -3]} intensity={0.7} color="#6cc3de" />
      <Stars radius={28} depth={18} count={900} factor={2.2} saturation={0.2} fade speed={0} />

      <mesh>
        <icosahedronGeometry args={[PLANET_RADIUS, 7]} />
        <meshStandardMaterial color="#176d7c" roughness={0.78} metalness={0.04} />
      </mesh>
      <mesh scale={1.013}>
        <icosahedronGeometry args={[PLANET_RADIUS, 4]} />
        <meshBasicMaterial color="#8ed7dd" transparent opacity={0.055} wireframe />
      </mesh>

      <LandMass latitude={-3} longitude={-18} color="#5d984e" scale={1.06} pieces={mathPieces} />
      <LandMass latitude={3} longitude={78} color="#4fa6a4" scale={0.88} pieces={englishPieces} />
      <LandMass latitude={34} longitude={148} color="#64716c" scale={0.82} pieces={futurePieces} />
      <LandMass latitude={-36} longitude={154} color="#6b625b" scale={0.74} pieces={futurePieces} />

      {visibleRegions.map((region) => (
        <RegionMarker
          key={region.id}
          region={region}
          selected={selectedRegionId === region.id}
          status={getRegionStatus(region, completedMissionIds)}
          onSelect={() => onSelectRegion(region.id)}
        />
      ))}

      <CameraControls controlsHandle={controlsHandle} reducedMotion={reducedMotion} />
    </>
  );
}

export const PlanetScene = forwardRef<PlanetControlsHandle, SceneProps>(function PlanetScene(props, ref) {
  return (
    <div className="planet-canvas" aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{position: [0, 0.35, 6.2], fov: 42, near: 0.1, far: 50}}
        gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
      >
        <WorldScene {...props} controlsHandle={ref} />
      </Canvas>
    </div>
  );
});
