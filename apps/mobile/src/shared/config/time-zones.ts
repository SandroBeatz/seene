/**
 * Curated IANA time zones for the onboarding / settings picker, each with a
 * human name and where it applies, in the app's three languages. The offset is
 * computed live (`zoneOffsetLabel`), so daylight saving is always right.
 *
 * Multi-zone countries list one entry per zone, named after the zone ("Восточное
 * время") with its cities as the place; single-zone countries list their city.
 */
import { DateTime } from 'luxon';
import type { AppLocale } from '@/shared/lib/i18n';

type Localized = Record<AppLocale, string>;

export interface TimeZoneEntry {
  id: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  name: Localized;
  place: Localized;
}

const z = (
  id: string,
  country: string,
  [ruName, ruPlace]: [string, string],
  [enName, enPlace]: [string, string],
  [frName, frPlace]: [string, string],
): TimeZoneEntry => ({
  id,
  country,
  name: { ru: ruName, en: enName, fr: frName },
  place: { ru: ruPlace, en: enPlace, fr: frPlace },
});

export const TIME_ZONES: readonly TimeZoneEntry[] = [
  // Central Asia & Caucasus
  z('Asia/Bishkek', 'KG', ['Бишкек', 'Кыргызстан'], ['Bishkek', 'Kyrgyzstan'], ['Bichkek', 'Kirghizistan']),
  z('Asia/Almaty', 'KZ', ['Алматы', 'Казахстан'], ['Almaty', 'Kazakhstan'], ['Almaty', 'Kazakhstan']),
  z('Asia/Tashkent', 'UZ', ['Ташкент', 'Узбекистан'], ['Tashkent', 'Uzbekistan'], ['Tachkent', 'Ouzbékistan']),
  z('Asia/Dushanbe', 'TJ', ['Душанбе', 'Таджикистан'], ['Dushanbe', 'Tajikistan'], ['Douchanbé', 'Tadjikistan']),
  z('Asia/Tbilisi', 'GE', ['Тбилиси', 'Грузия'], ['Tbilisi', 'Georgia'], ['Tbilissi', 'Géorgie']),
  z('Asia/Yerevan', 'AM', ['Ереван', 'Армения'], ['Yerevan', 'Armenia'], ['Erevan', 'Arménie']),
  z('Asia/Baku', 'AZ', ['Баку', 'Азербайджан'], ['Baku', 'Azerbaijan'], ['Bakou', 'Azerbaïdjan']),
  // Russia
  z('Europe/Kaliningrad', 'RU', ['Калининград', 'Россия'], ['Kaliningrad', 'Russia'], ['Kaliningrad', 'Russie']),
  z('Europe/Moscow', 'RU', ['Москва', 'Россия'], ['Moscow', 'Russia'], ['Moscou', 'Russie']),
  z('Europe/Samara', 'RU', ['Самара', 'Россия'], ['Samara', 'Russia'], ['Samara', 'Russie']),
  z('Asia/Yekaterinburg', 'RU', ['Екатеринбург', 'Россия'], ['Yekaterinburg', 'Russia'], ['Iekaterinbourg', 'Russie']),
  z('Asia/Novosibirsk', 'RU', ['Новосибирск', 'Россия'], ['Novosibirsk', 'Russia'], ['Novossibirsk', 'Russie']),
  z('Asia/Krasnoyarsk', 'RU', ['Красноярск', 'Россия'], ['Krasnoyarsk', 'Russia'], ['Krasnoïarsk', 'Russie']),
  z('Asia/Irkutsk', 'RU', ['Иркутск', 'Россия'], ['Irkutsk', 'Russia'], ['Irkoutsk', 'Russie']),
  z('Asia/Vladivostok', 'RU', ['Владивосток', 'Россия'], ['Vladivostok', 'Russia'], ['Vladivostok', 'Russie']),
  // Europe & Middle East
  z('Europe/Minsk', 'BY', ['Минск', 'Беларусь'], ['Minsk', 'Belarus'], ['Minsk', 'Biélorussie']),
  z('Europe/Kiev', 'UA', ['Киев', 'Украина'], ['Kyiv', 'Ukraine'], ['Kyiv', 'Ukraine']),
  z('Europe/Istanbul', 'TR', ['Стамбул', 'Турция'], ['Istanbul', 'Türkiye'], ['Istanbul', 'Turquie']),
  z('Asia/Dubai', 'AE', ['Дубай', 'ОАЭ'], ['Dubai', 'UAE'], ['Dubaï', 'Émirats arabes unis']),
  z('Europe/London', 'GB', ['Лондон', 'Великобритания'], ['London', 'United Kingdom'], ['Londres', 'Royaume-Uni']),
  z('Europe/Paris', 'FR', ['Париж', 'Франция'], ['Paris', 'France'], ['Paris', 'France']),
  z('Europe/Berlin', 'DE', ['Берлин', 'Германия'], ['Berlin', 'Germany'], ['Berlin', 'Allemagne']),
  z('Europe/Warsaw', 'PL', ['Варшава', 'Польша'], ['Warsaw', 'Poland'], ['Varsovie', 'Pologne']),
  // Canada
  z('America/St_Johns', 'CA', ['Ньюфаундленд', 'Сент-Джонс'], ['Newfoundland', 'St. John’s'], ['Terre-Neuve', 'Saint-Jean']),
  z('America/Halifax', 'CA', ['Атлантическое время', 'Галифакс'], ['Atlantic time', 'Halifax'], ['Heure de l’Atlantique', 'Halifax']),
  z('America/Toronto', 'CA', ['Восточное время', 'Торонто, Монреаль, Оттава'], ['Eastern time', 'Toronto, Montreal, Ottawa'], ['Heure de l’Est', 'Toronto, Montréal, Ottawa']),
  z('America/Winnipeg', 'CA', ['Центральное время', 'Виннипег'], ['Central time', 'Winnipeg'], ['Heure du Centre', 'Winnipeg']),
  z('America/Edmonton', 'CA', ['Горное время', 'Калгари, Эдмонтон'], ['Mountain time', 'Calgary, Edmonton'], ['Heure des Rocheuses', 'Calgary, Edmonton']),
  z('America/Vancouver', 'CA', ['Тихоокеанское время', 'Ванкувер, Виктория'], ['Pacific time', 'Vancouver, Victoria'], ['Heure du Pacifique', 'Vancouver, Victoria']),
  // United States
  z('America/New_York', 'US', ['Восточное время', 'Нью-Йорк, Майами'], ['Eastern time', 'New York, Miami'], ['Heure de l’Est', 'New York, Miami']),
  z('America/Chicago', 'US', ['Центральное время', 'Чикаго, Даллас'], ['Central time', 'Chicago, Dallas'], ['Heure du Centre', 'Chicago, Dallas']),
  z('America/Denver', 'US', ['Горное время', 'Денвер'], ['Mountain time', 'Denver'], ['Heure des Rocheuses', 'Denver']),
  z('America/Los_Angeles', 'US', ['Тихоокеанское время', 'Лос-Анджелес, Сиэтл'], ['Pacific time', 'Los Angeles, Seattle'], ['Heure du Pacifique', 'Los Angeles, Seattle']),
];

const BY_ID = new Map(TIME_ZONES.map((entry) => [entry.id, entry]));

/** The catalog entry, or one made from the IANA id ("America/Sao_Paulo" → "Sao Paulo"). */
export function timeZoneEntry(id: string): TimeZoneEntry {
  const known = BY_ID.get(id);
  if (known) return known;
  const city = (id.split('/').pop() ?? id).replace(/_/g, ' ');
  return { id, country: '', name: { ru: city, en: city, fr: city }, place: { ru: '', en: '', fr: '' } };
}

/** The zone's UTC offset right now, minutes (DST-aware). */
export function zoneOffsetMinutes(id: string, at: DateTime = DateTime.now()): number {
  return at.setZone(id).offset;
}

/** "GMT+6", "GMT−3:30", "GMT" — the zone's offset right now (DST-aware). */
export function zoneOffsetLabel(id: string, at: DateTime = DateTime.now()): string {
  const minutes = zoneOffsetMinutes(id, at);
  if (!minutes) return 'GMT';
  const sign = minutes > 0 ? '+' : '−';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}
