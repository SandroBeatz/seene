/**
 * One step-4 row: square check, the service name, and "1 ч 30 мин · 300 сом ·
 * Изменить" (or "· Добавить цену" while it has no price). The row toggles the
 * service; the rose links open the service sheet.
 */
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { formatAmount } from '@/shared/lib/formats';
import { SelectionMark, Text } from '@/shared/ui';
import { formatDurationLabel } from '../model/format';
import type { DraftService } from '../model/services';

export interface ServiceRowProps {
  service: DraftService;
  /** Display name (own, or the catalog's in the current language). */
  name: string;
  currency: string;
  onToggle: () => void;
  onEdit: () => void;
  onAddPrice: () => void;
}

export function ServiceRow({ service, name, currency, onToggle, onEdit, onAddPrice }: ServiceRowProps) {
  const { t, i18n } = useTranslation();
  const { selected, price } = service;
  const priceLabel =
    price === null
      ? null
      : price === 0
        ? t('onboarding.services.free')
        : formatAmount(price, { currency, locale: i18n.language });

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={name}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.check}>
        <SelectionMark checked={selected} shape="square" />
      </View>
      <View style={styles.body}>
        <Text variant="bodyStrong">{name}</Text>
        <Text variant="footnote" color="secondary">
          {formatDurationLabel(service.duration, t)}
          {priceLabel ? ` · ${priceLabel}` : ''}
          {selected ? ' · ' : ''}
          {selected ? (
            <Text
              variant="footnoteStrong"
              color="brand"
              accessibilityRole="link"
              onPress={price === null ? onAddPrice : onEdit}>
              {price === null ? t('onboarding.services.addPrice') : t('onboarding.services.edit')}
            </Text>
          ) : null}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3.5],
    minHeight: theme.sizing.row.xl,
    paddingVertical: theme.space[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  check: { height: theme.sizing.minTouch, justifyContent: 'center' },
  body: { flex: 1, minWidth: 0, gap: theme.space[0.5] },
  pressed: { opacity: 0.7 },
}));
