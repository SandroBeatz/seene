/**
 * The country a new client's phone starts in: the master's time zone, then their
 * profile country, then the phone's own region (`defaultPhoneCountry`).
 */
import { getLocales } from 'expo-localization';
import { parseStoredSchedule, useMasterProfileQuery } from '@/entities/master';
import { useUserId } from '@/entities/session';
import { defaultPhoneCountry, type CountryCode } from '@/shared/lib/phone';
import { deviceTimeZone } from '@/shared/lib/time-zone';

export function usePhoneCountry(): { country: CountryCode; isPending: boolean } {
  const profile = useMasterProfileQuery(useUserId() ?? '');
  const zone = parseStoredSchedule(profile.data?.schedule)?.timezone ?? deviceTimeZone();
  return {
    country: defaultPhoneCountry(zone, profile.data?.country, getLocales()[0]?.regionCode),
    isPending: profile.isPending,
  };
}
