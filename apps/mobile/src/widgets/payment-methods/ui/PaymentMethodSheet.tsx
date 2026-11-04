/** One of the master's own methods: new, or renamed. Deleting keeps past payments. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  useCreatePaymentTypeMutation,
  useDeletePaymentTypeMutation,
  usePaymentTypesQuery,
  useUpdatePaymentTypeMutation,
  type PaymentType,
} from '@/entities/payment-type';
import { useUserId } from '@/entities/session';
import { Button, FormScreen, Input, SheetChrome, showFailedToast, showToast } from '@/shared/ui';
import { isLastActive, nextMethodOrder } from '../lib/methods';

export function PaymentMethodSheet() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const userId = useUserId() ?? '';
  const methods = usePaymentTypesQuery(userId);
  if (!methods.data) return null;
  return (
    <MethodForm
      key={id ?? 'new'}
      method={methods.data.find((m) => m.id === id)}
      all={methods.data}
      userId={userId}
    />
  );
}

function MethodForm({
  method,
  all,
  userId,
}: {
  method?: PaymentType;
  all: PaymentType[];
  userId: string;
}) {
  const { t } = useTranslation();
  const create = useCreatePaymentTypeMutation(userId);
  const update = useUpdatePaymentTypeMutation(userId);
  const remove = useDeletePaymentTypeMutation(userId);
  const [name, setName] = useState(method?.name ?? '');

  const failed = () => showFailedToast();
  const options = {
    onSuccess: () => {
      showToast({ title: t('toasts.paymentsSaved') });
      router.back();
    },
    onError: failed,
  };

  const save = () => {
    const value = name.trim();
    if (method) update.mutate({ id: method.id, name: value }, options);
    else create.mutate({ name: value, sort_order: nextMethodOrder(all) }, options);
  };

  const confirmDelete = () => {
    // Checkout would have nothing to offer.
    if (method && isLastActive(method, all)) {
      Alert.alert(t('menuHome.payments.lastActive'));
      return;
    }
    Alert.alert(t('menuHome.payments.deleteTitle'), t('menuHome.payments.deleteText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => method && remove.mutate(method.id, options),
      },
    ]);
  };

  return (
    <FormScreen
      edges={['left', 'right', 'bottom']}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      footer={
        <Button
          label={t('common.save')}
          disabled={!name.trim()}
          loading={create.isPending || update.isPending}
          onPress={save}
          fullWidth
        />
      }>
      <SheetChrome
        title={method ? t('menuHome.payments.editTitle') : t('menuHome.payments.newTitle')}
        leadingLabel={t('common.close')}
        action={
          method
            ? {
                key: 'delete',
                label: t('common.delete'),
                sf: 'trash',
                icon: 'trash',
                destructive: true,
                onPress: confirmDelete,
              }
            : undefined
        }
      />
      <Input
        variant="filled"
        accessibilityLabel={t('menuHome.payments.namePlaceholder')}
        placeholder={t('menuHome.payments.namePlaceholder')}
        value={name}
        onChangeText={setName}
        autoCapitalize="sentences"
        autoFocus
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingTop: theme.space[2] },
}));
