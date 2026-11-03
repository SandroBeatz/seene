/** The menu's "Деньги" group (design "Меню"): "Финансы" and "Расходы" with this month's sums. */
import { useMemo } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { currentPeriod, periodRange, useMoneyOverviewQuery } from '@/entities/analytics';
import { useMoneyContext } from '@/entities/master';
import { usePaymentTypesQuery } from '@/entities/payment-type';
import { useUserId } from '@/entities/session';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import { MenuGroup, MenuRow, useNow } from '@/shared/ui';

export function MoneyMenuSection() {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const userId = useUserId() ?? '';
  const ctx = useMoneyContext(userId);
  const now = useNow();
  const today = DateTime.fromMillis(now, { zone: ctx.zone });
  const todayKey = today.toISODate()!;
  const range = useMemo(
    () => periodRange(currentPeriod('month', todayKey, ctx.zone), todayKey, ctx.zone),
    [todayKey, ctx.zone],
  );
  const overview = useMoneyOverviewQuery(userId, { ...range, zone: ctx.zone });
  const methods = usePaymentTypesQuery(userId).data?.filter((m) => m.is_active).length;
  const month = (t('months', { returnObjects: true }) as string[])[today.month - 1];
  const value = (amount: number | undefined) =>
    amount === undefined ? undefined : `${month}: ${ctx.money(amount)}`;

  return (
    <MenuGroup label={t('money.menuSection')}>
      <MenuRow
        icon="analytics"
        title={t('money.menuFinance')}
        value={value(overview.data?.current.earned)}
        onPress={() => router.push('/analytics')}
      />
      <MenuRow
        icon="receipt"
        title={t('expenses.title')}
        value={value(overview.data?.current.spent)}
        onPress={() => router.push('/settings/expenses')}
      />
      <MenuRow
        icon="cash"
        title={t('menuHome.payments.title')}
        value={
          methods === undefined
            ? undefined
            : t(`menuHome.payments.count_${pluralCategory(methods, locale)}`, { count: methods })
        }
        onPress={() => router.push('/settings/payment-methods')}
      />
    </MenuGroup>
  );
}
