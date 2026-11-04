/** The cover's 2:1 frame over a photo: how far it can move, and what it cuts out. Pure. */

export const COVER_ASPECT = 2;
/** The board asks for a photo from 1200 × 600; this is enough for the page, and no more. */
export const COVER_MAX_WIDTH = 1600;
export const COVER_MAX_ZOOM = 4;

export interface Size {
  width: number;
  height: number;
}

/** The scale at which the photo just covers the frame. */
export function coverScale(image: Size, frame: Size): number {
  'worklet';
  return Math.max(frame.width / image.width, frame.height / image.height);
}

/** Keeps the frame on the photo: `offset` is the photo's centre from the frame's centre. */
export function clampOffset(offset: number, shown: number, frame: number): number {
  'worklet';
  const limit = Math.max(0, (shown - frame) / 2);
  return Math.min(limit, Math.max(-limit, offset));
}

export function clampZoom(zoom: number): number {
  'worklet';
  return Math.min(COVER_MAX_ZOOM, Math.max(1, zoom));
}

/** The part of the photo inside the frame, in the photo's own pixels. */
export function cropRect(image: Size, frame: Size, zoom: number, offset: { x: number; y: number }) {
  const scale = coverScale(image, frame) * zoom;
  const width = Math.min(image.width, frame.width / scale);
  const height = Math.min(image.height, frame.height / scale);
  const edge = (size: number, cut: number, shift: number) =>
    Math.max(0, Math.min(size - cut, (size - cut) / 2 - shift / scale));
  return {
    originX: Math.round(edge(image.width, width, offset.x)),
    originY: Math.round(edge(image.height, height, offset.y)),
    width: Math.round(width),
    height: Math.round(height),
  };
}
