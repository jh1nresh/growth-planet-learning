import {describe, expect, it} from 'vitest';
import {getGreatCirclePoints, latLonToVector3} from './globeMath';

describe('globe geometry', () => {
  it('places longitude zero on the camera-facing hemisphere', () => {
    const point = latLonToVector3(0, 0, 2);
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(0);
    expect(point.z).toBeCloseTo(2);
  });

  it('maps ninety degrees east onto the positive x axis', () => {
    const point = latLonToVector3(0, 90, 2);
    expect(point.x).toBeCloseTo(2);
    expect(point.z).toBeCloseTo(0);
  });

  it('places longitude 180 on the occluded back hemisphere', () => {
    const point = latLonToVector3(0, 180, 2);
    expect(point.x).toBeCloseTo(0);
    expect(point.z).toBeCloseTo(-2);
  });

  it('keeps every dependency path point on the globe surface', () => {
    const source = latLonToVector3(18, -32, 2);
    const target = latLonToVector3(-20, 12, 2);
    const points = getGreatCirclePoints(source, target, 2.05, 12);

    expect(points).toHaveLength(13);
    expect(points[0].length()).toBeCloseTo(2.05);
    expect(points[6].length()).toBeCloseTo(2.05);
    expect(points[12].length()).toBeCloseTo(2.05);
  });
});
