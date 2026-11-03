/**
 * "Способы оплаты" (design AppPayMethods). The master's own methods aren't in the design;
 * they stay, under the system ones: MBank and the like are how people pay in Kyrgyzstan.
 */
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  useEnsureSystemPaymentTypesMutation,
  usePaymentTypesQuery,
  useTogglePaymentTypeActiveMutation,
  type PaymentType,
} from '@/entities/payment-type';
import { useUserId } from '@/entities/session';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import {
  ErrorState,
  GroupedCard,
  ListItem,
  ScreenScrollView,
  SectionLabel,
  Switch,
  Text,
} from '@/shared/ui';
import { customMethods, isLastActive, systemMethods } from '../lib/methods';

export function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const methods = usePaymentTypesQuery(userId);
  const toggle = useTogglePaymentTypeActiveMutation(userId);
  const { mutate: ensureSystem } = useEnsureSystemPaymentTypesMutation(userId);

  useEffect(() => {
    if (userId) ensureSystem();
  }, [userId, ensureSystem]);

  if (methods.isError) {
    return (
      <ErrorState
        message={t(errorMessageKey(normalizeError(methods.error)))}
        onRetry={() => void methods.refetch()}
      />
    );
  }
  const all = methods.data ?? [];
  const own = customMethods(all);

  const flip = (method: PaymentType, isActive: boolean) => {
    if (!isActive && isLastActive(method, all)) {
      Alert.alert(t('menuHome.payments.lastActive'));
      return;
    }
    toggle.mutate(
      { id: method.id, isActive },
      { onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')) },
    );
  };

  const row = (method: PaymentType, title: string, onPress?: () => void) => (
    <ListItem
      key={method.id}
      size="menu"
      inset={false}
      title={title}
      onPress={onPress}
      showChevron={false}
      right={
        <Switch
          value={method.is_active}
          onValueChange={(isActive) => flip(method, isActive)}
          accessibilityLabel={title}
        />
      }
    />
  );

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      {all.length ? (
        <GroupedCard variant="menu">
          {systemMethods(all).map((method) => row(method, t(`menuHome.payments.${method.kind}`)))}
        </GroupedCard>
      ) : null}
      <Text variant="caption" color="tertiary" style={styles.hint}>
        {t('menuHome.payments.hint')}
      </Text>

      {own.length ? (
        <>
          <View style={styles.label}>
            <SectionLabel label={t('menuHome.payments.ownSection')} />
          </View>
          <GroupedCard variant="menu">
            {own.map((method) =>
              row(method, method.name, () =>
                router.push({ pathname: '/payment-method', params: { id: method.id } }),
              ),
            )}
          </GroupedCard>
        </>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/payment-method')}
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
        <Text variant="subheadStrong">{t('menuHome.payments.add')}</Text>
      </Pressable>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingHorizontal: theme.space[5], paddingTop: theme.space[5.5] },
  hint: { marginTop: theme.space[2], marginHorizontal: theme.space[1] },
  label: { marginTop: theme.space[5.5], marginBottom: theme.space[2], marginHorizontal: theme.space[1] },
  add: {
    marginTop: theme.space[3.5],
    height: theme.sizing.control.lg,
    borderRadius: theme.radius.field,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
}));
