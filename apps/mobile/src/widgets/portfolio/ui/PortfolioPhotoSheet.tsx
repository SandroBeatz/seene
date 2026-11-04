/** One photo, large: its caption and service. The design has no screen for this. */
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  CAPTION_MAX_LENGTH,
  useDeletePortfolioItemMutation,
  usePortfolioQuery,
  useUpdatePortfolioItemMutation,
  type PortfolioItem,
} from '@/entities/portfolio';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import {
  Button,
  FormScreen,
  Input,
  SectionLabel,
  SelectionMark,
  SheetChrome,
  Text,
  showFailedToast,
} from '@/shared/ui';

export function PortfolioPhotoSheet() {
  const { itemId, focus } = useLocalSearchParams<{ itemId: string; focus?: string }>();
  const userId = useUserId() ?? '';
  const portfolio = usePortfolioQuery(userId);
  const item = portfolio.data?.find((photo) => photo.id === itemId);
  if (!item) return null;
  return <PhotoForm item={item} userId={userId} focusCaption={focus === 'caption'} />;
}

function PhotoForm({
  item,
  userId,
  focusCaption,
}: {
  item: PortfolioItem;
  userId: string;
  focusCaption: boolean;
}) {
  const { t } = useTranslation();
  const services = useServicesQuery(userId);
  const update = useUpdatePortfolioItemMutation(userId);
  const remove = useDeletePortfolioItemMutation(userId);
  const [caption, setCaption] = useState(item.caption ?? '');
  const [serviceId, setServiceId] = useState(item.service_id);

  const failed = () => showFailedToast();
  const options = { onSuccess: () => router.back(), onError: failed };

  const save = () =>
    update.mutate(
      { id: item.id, patch: { caption: caption.trim() || null, service_id: serviceId } },
      options,
    );

  const confirmDelete = () =>
    Alert.alert(t('menuHome.portfolio.deleteTitle'), t('menuHome.portfolio.deleteText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => remove.mutate(item, options),
      },
    ]);

  // An archived service stays listed while the photo is linked to it.
  const choices = (services.data ?? []).filter((s) => s.is_active || s.id === item.service_id);
  const rows = [
    { id: null, name: t('menuHome.portfolio.noService') },
    ...choices.map((s) => ({ id: s.id as string | null, name: s.name })),
  ];

  return (
    <FormScreen
      edges={['left', 'right', 'bottom']}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      footer={
        <Button label={t('common.save')} loading={update.isPending} onPress={save} fullWidth />
      }>
      <SheetChrome
        title={t('menuHome.portfolio.photo')}
        leadingLabel={t('common.close')}
        action={{
          key: 'delete',
          label: t('common.delete'),
          sf: 'trash',
          icon: 'trash',
          destructive: true,
          onPress: confirmDelete,
        }}
      />
      <Image source={{ uri: item.photo_url }} style={styles.photo} contentFit="contain" />
      <Input
        variant="filled"
        accessibilityLabel={t('menuHome.portfolio.caption')}
        placeholder={t('menuHome.portfolio.captionPlaceholder')}
        value={caption}
        onChangeText={setCaption}
        maxLength={CAPTION_MAX_LENGTH}
        autoCapitalize="sentences"
        autoFocus={focusCaption}
      />
      <SectionLabel label={t('menuHome.portfolio.service')} />
      <View accessibilityRole="radiogroup">
        {rows.map((row, index) => (
          <Pressable
            key={row.id ?? 'none'}
            accessibilityRole="radio"
            accessibilityState={{ checked: row.id === serviceId }}
            onPress={() => setServiceId(row.id)}
            style={({ pressed }) => [
              styles.row,
              index > 0 && styles.separator,
              pressed && styles.pressed,
            ]}>
            <Text variant="calloutMedium" numberOfLines={1} style={styles.name}>
              {row.name}
            </Text>
            <SelectionMark checked={row.id === serviceId} shape="circle" />
          </Pressable>
        ))}
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingTop: theme.space[2], gap: theme.space[3] },
  photo: {
    width: '100%',
    height: 280,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.surface,
  },
  row: {
    minHeight: theme.sizing.row.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  separator: { borderTopWidth: 1, borderTopColor: theme.colors.border.default },
  name: { flex: 1 },
  pressed: { opacity: 0.6 },
}));
