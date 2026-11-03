/** A category: new under a direction, or renamed. Deleting keeps its services. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  useCreateServiceCategoryMutation,
  useDeleteServiceCategoryMutation,
  useServiceCategoriesQuery,
  useUpdateServiceCategoryMutation,
  type ServiceCategory,
} from '@/entities/service-category';
import { useUserId } from '@/entities/session';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { Button, ErrorState, FormScreen, Input, SheetChrome } from '@/shared/ui';
import { nextSortOrder } from '../lib/draft';

export function ServiceCategorySheet() {
  const { t } = useTranslation();
  const { id, specialization } = useLocalSearchParams<{ id?: string; specialization?: string }>();
  const userId = useUserId() ?? '';
  const categories = useServiceCategoriesQuery(userId);
  if (!categories.data) {
    if (!categories.isError) return null;
    return (
      <ErrorState
        message={t(errorMessageKey(normalizeError(categories.error)))}
        onRetry={() => void categories.refetch()}
      />
    );
  }
  return (
    <CategoryForm
      category={categories.data.find((c) => c.id === id)}
      all={categories.data}
      specialization={specialization ?? null}
      userId={userId}
    />
  );
}

function CategoryForm({
  category,
  all,
  specialization,
  userId,
}: {
  category?: ServiceCategory;
  all: ServiceCategory[];
  specialization: string | null;
  userId: string;
}) {
  const { t } = useTranslation();
  const create = useCreateServiceCategoryMutation(userId);
  const update = useUpdateServiceCategoryMutation(userId);
  const remove = useDeleteServiceCategoryMutation(userId);
  const [name, setName] = useState(category?.name ?? '');

  const failed = () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage'));
  const options = { onSuccess: () => router.back(), onError: failed };

  const save = () => {
    const value = name.trim();
    if (category) update.mutate({ id: category.id, name: value }, options);
    else create.mutate({ name: value, specialization, sort_order: nextSortOrder(all) }, options);
  };

  const confirmDelete = () =>
    Alert.alert(
      t('menuHome.servicesPage.categoryDeleteTitle'),
      t('menuHome.servicesPage.categoryDeleteText'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('menuHome.servicesPage.delete'),
          style: 'destructive',
          onPress: () => category && remove.mutate(category.id, options),
        },
      ],
    );

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
        title={
          category
            ? t('menuHome.servicesPage.categoryTitle')
            : t('menuHome.servicesPage.categoryTitleNew')
        }
        leadingLabel={t('common.close')}
        action={
          category
            ? {
                key: 'delete',
                label: t('menuHome.servicesPage.delete'),
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
        accessibilityLabel={t('menuHome.servicesPage.categoryPlaceholder')}
        placeholder={t('menuHome.servicesPage.categoryPlaceholder')}
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
