/** Cuts a part out of a picture and saves it as a JPEG in the cache. */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export async function cropImage(
  uri: string,
  rect: { originX: number; originY: number; width: number; height: number },
  maxWidth: number,
) {
  const context = ImageManipulator.manipulate(uri).crop(rect);
  if (rect.width > maxWidth) context.resize({ width: maxWidth, height: null });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  return { uri: saved.uri, mimeType: 'image/jpeg' };
}
