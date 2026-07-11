import {Vector3} from 'three';

const DEG_TO_RAD = Math.PI / 180;

export function getFallbackGlobeTransform(view: {yaw: number; pitch: number; zoom: number}) {
  return `rotateX(${-view.pitch}rad) rotateY(${view.yaw}rad) scale(${view.zoom})`;
}

export function latLonToVector3(latitude: number, longitude: number, radius: number) {
  const latitudeRadians = latitude * DEG_TO_RAD;
  const longitudeRadians = longitude * DEG_TO_RAD;
  const latitudeRadius = Math.cos(latitudeRadians) * radius;

  return new Vector3(
    Math.sin(longitudeRadians) * latitudeRadius,
    Math.sin(latitudeRadians) * radius,
    Math.cos(longitudeRadians) * latitudeRadius,
  );
}

export function getGreatCirclePoints(source: Vector3, target: Vector3, radius: number, segments = 24) {
  const start = source.clone().normalize();
  const end = target.clone().normalize();
  const angle = Math.acos(Math.min(1, Math.max(-1, start.dot(end))));
  const angleSine = Math.sin(angle);

  return Array.from({length: segments + 1}, (_, index) => {
    const progress = index / segments;
    if (angleSine < 0.00001) return start.clone().lerp(end, progress).normalize().multiplyScalar(radius);
    return start.clone()
      .multiplyScalar(Math.sin((1 - progress) * angle) / angleSine)
      .add(end.clone().multiplyScalar(Math.sin(progress * angle) / angleSine))
      .normalize()
      .multiplyScalar(radius);
  });
}
