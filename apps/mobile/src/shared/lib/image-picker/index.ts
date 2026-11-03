/** The system photo picker. It runs out of process, so it needs no photo permission. */
import { launchImageLibraryAsync } from 'expo-image-picker';

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
