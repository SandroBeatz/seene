import { Share } from 'react-native';
import { masterPageUrl } from '@/entities/master';

/** Opens the system share sheet with the page link. iOS shares `url`, Android `message`. */
export function sharePage(username: string) {
  const url = masterPageUrl(username);
  // A failed share leaves nothing to recover: the master just taps again.
  void Share.share(process.env.EXPO_OS === 'ios' ? { url } : { message: url }).catch(() => undefined);
}
