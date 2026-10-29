/**
 * "Профиль создан" shows once, on the first Today after onboarding. Finishing
 * onboarding marks it; closing the modal clears it. Stored on the device, so a
 * reinstall or another phone does not show it again for an existing profile.
 */
import { kv } from '@/shared/api/storage';

const KEY = 'seene.profile-created-notice';

export const profileCreatedNotice = {
  mark: () => kv.set(KEY, '1'),
  isPending: () => kv.getString(KEY) === '1',
  clear: () => kv.delete(KEY),
};
