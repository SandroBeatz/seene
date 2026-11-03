/** "2 часа", "30 дней", "За 12 часов": an option's value as the design writes it. */
import { useTranslation } from 'react-i18next';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import type { BookingOption } from '../lib/options';

export function useOptionLabel() {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const plural = (key: string, count: number) =>
    t(`${key}_${pluralCategory(count, locale)}`, { count });
  const minutes = (value: number) =>
    value >= 60 && value % 60 === 0
      ? plural('menuHome.booking.hours', value / 60)
      : plural('menuHome.booking.minutes', value);

  return (option: BookingOption, value: number): string => {
    switch (option) {
      case 'notice':
        return value === 0 ? t('menuHome.booking.noticeNone') : minutes(value);
      case 'horizon':
        return plural('menuHome.hours.days', value);
      case 'step':
        return minutes(value);
      case 'buffer':
        return value === 0 ? t('menuHome.booking.bufferNone') : minutes(value);
      case 'cancel':
        return value === 0
          ? t('menuHome.booking.cancelNone')
          : plural('menuHome.booking.cancelHours', value);
    }
  };
}
