import { describe, expect, it } from '@jest/globals';
import { clampOffset, clampZoom, coverScale, cropRect } from './cover-crop';

const frame = { width: 350, height: 175 };

describe('coverScale', () => {
  it('covers the frame with a wide photo by its height', () => {
    expect(coverScale({ width: 4000, height: 1000 }, frame)).toBe(0.175);
  });

  it('covers the frame with a tall photo by its width', () => {
    expect(coverScale({ width: 1000, height: 3000 }, frame)).toBe(0.35);
  });
});

describe('clampOffset', () => {
  it('stops at the photo edge', () => {
    expect(clampOffset(500, 450, 350)).toBe(50);
    expect(clampOffset(-500, 450, 350)).toBe(-50);
  });

  it('holds still when the photo just fits', () => {
    expect(clampOffset(20, 350, 350)).toBe(0);
  });
});

describe('clampZoom', () => {
  it('stays between the fit and the limit', () => {
    expect(clampZoom(0.5)).toBe(1);
    expect(clampZoom(9)).toBe(4);
  });
});

describe('cropRect', () => {
  it('cuts the middle of a wide photo, 2:1', () => {
    expect(cropRect({ width: 4000, height: 1000 }, frame, 1, { x: 0, y: 0 })).toEqual({
      originX: 1000,
      originY: 0,
      width: 2000,
      height: 1000,
    });
  });

  it('cuts further left when the photo is moved right', () => {
    const rect = cropRect({ width: 4000, height: 1000 }, frame, 1, { x: 175, y: 0 });
    expect(rect.originX).toBe(0);
  });

  it('cuts a smaller part when zoomed in', () => {
    expect(cropRect({ width: 4000, height: 1000 }, frame, 2, { x: 0, y: 0 })).toEqual({
      originX: 1500,
      originY: 250,
      width: 1000,
      height: 500,
    });
  });

  it('never leaves the photo', () => {
    const rect = cropRect({ width: 1000, height: 3000 }, frame, 1, { x: 0, y: 9000 });
    expect(rect.originY).toBe(0);
    expect(rect.height).toBe(500);
  });
});
