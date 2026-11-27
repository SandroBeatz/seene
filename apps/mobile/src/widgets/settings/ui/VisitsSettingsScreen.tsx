/**
 * "Завершение визитов" (design "Меню v2 · Завершение визитов"): auto-complete and the
 * payment method the visits it closes get.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { useMasterSettingsQuery, useUpdateMasterSettings } from '@/entities/master';
import { usePaymentTypesQuery } from '@/entities/payment-type';
import { useUserId } from '@/entities/session';
import {
  GroupedCard,
  ListItem,
  MenuRow,
  ScreenScrollView,
  Switch,
  Text,
  showFailedToast,
} from '@/shared/ui';

export function VisitsSettingsScreen() {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const settings = useMasterSettingsQuery(userId);
  const update = useUpdateMasterSettings(userId);
  const methods = usePaymentTypesQuery(userId).data;

  const autoOn = !!settings.data?.auto_complete_since;
  const autoMethod = methods?.find((m) => m.id === settings.data?.auto_complete_payment_type_id);
  const setAutoComplete = (on: boolean) =>
    update.mutate(
      { auto_complete_since: on ? new Date().toISOString() : null },
      {
        // The visits it closes need a method: asked right away, as the owner wants.
        onSuccess: () => {
          if (on && !autoMethod) router.push('/settings/auto-payment');
        },
        onError: () => showFailedToast(() => setAutoComplete(on)),
      },
    );

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <GroupedCard variant="menu">
        <ListItem
          size="menu"
          inset={false}
          title={t('menuHome.screen.autoComplete')}
          subtitle={t('menuHome.screen.autoCompleteHint')}
          right={
            <Switch
              value={autoOn}
              onValueChange={setAutoComplete}
              accessibilityLabel={t('menuHome.screen.autoComplete')}
            />
          }
        />
        {autoOn ? (
          <MenuRow
            title={t('menuHome.screen.autoPayment')}
            value={
              autoMethod
                ? autoMethod.kind === 'custom'
                  ? autoMethod.name
                  : t(`checkout.methods.${autoMethod.kind}`)
                : t('menuHome.screen.autoPaymentNone')
            }
            onPress={() => router.push('/settings/auto-payment')}
          />
        ) : null}
      </GroupedCard>
      <Text variant="caption" color="secondary" style={styles.hint}>
        {t('menuHome.visits.hint')}
      </Text>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingHorizontal: theme.space[5], paddingTop: theme.space[3.5] },
  hint: { marginTop: theme.space[2], marginHorizontal: theme.space[1] },
}));
