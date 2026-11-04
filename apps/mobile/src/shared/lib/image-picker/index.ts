/** The system photo picker. It runs out of process, so it needs no photo permission. */
import {
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
} from 'expo-image-picker';

export { cropImage } from './crop';

export interface PickedImage {
  uri: string;
  mimeType: string;
}

/** `square` opens the crop step (the system's is always square on iOS). Null when cancelled. */
export async function pickImage(options: { square?: boolean } = {}): Promise<PickedImage | null> {
  const result = await launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: options.square ?? false,
    aspect: options.square ? [1, 1] : undefined,
    quality: 0.8,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' } : null;
}

/** The camera; it asks for permission first. `denied` when the master said no. */
export async function takePhoto(): Promise<PickedImage | 'denied' | null> {
  const permission = await requestCameraPermissionsAsync();
  if (!permission.granted) return 'denied';
  const result = await launchCameraAsync({ mediaTypes: 'images', quality: 0.8 });
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' } : null;
}

/** Several photos at once, in the order they were picked. Empty when cancelled. */
export async function pickImages(limit: number): Promise<PickedImage[]> {
  const result = await launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsMultipleSelection: true,
    orderedSelection: true,
    selectionLimit: limit,
    quality: 0.8,
  });
  if (result.canceled) return [];
  return result.assets.map((asset) => ({
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
  }));
}
