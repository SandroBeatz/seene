import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { typography, type TypographyVariant } from '@/shared/theme/tokens';
import { Card, Icon, ICON_NAMES, Text } from '@/shared/ui';
import { UIKitScreen, UIKitSectionTitle } from '@/widgets/uikit-catalog';

const TYPE_VARIANTS = Object.keys(typography) as TypographyVariant[];
const RADII = ['sm', 'segment', 'md', 'field', 'lg', 'xl', 'panel', 'xxl'] as const;

export default function UIKitFoundationsScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const colors = [
    ['canvas', theme.colors.bg.canvas],
    ['surface', theme.colors.bg.surface],
    ['sunken', theme.colors.bg.sunken],
    ['ink', theme.colors.accent.default],
    ['secondary', theme.colors.content.secondary],
    ['tertiary', theme.colors.content.tertiary],
    ['border', theme.colors.border.default],
    ['strong', theme.colors.border.strong],
    ['success', theme.colors.feedback.success],
    ['danger', theme.colors.feedback.danger],
  ] as const;
  const brand = [
    ['default', theme.colors.brand.default],
    ['text', theme.colors.brand.text],
    ['strong', theme.colors.brand.strong],
    ['subtle', theme.colors.brand.subtle],
  ] as const;

  return (
    <UIKitScreen>
      <UIKitSectionTitle>{t('uikit.foundation.colors')}</UIKitSectionTitle>
      <View style={styles.wrap}>
        {colors.map(([name, color]) => (
          <View key={name} style={styles.swatchItem}>
            <View style={[styles.swatch, { backgroundColor: color }]} />
            <Text variant="caption">{name}</Text>
          </View>
        ))}
      </View>

      <UIKitSectionTitle>{t('uikit.foundation.brand')}</UIKitSectionTitle>
      <View style={styles.wrap}>
        {brand.map(([name, color]) => (
          <View key={name} style={styles.swatchItem}>
            <View style={[styles.swatch, { backgroundColor: color }]} />
            <Text variant="caption">{name}</Text>
          </View>
        ))}
      </View>

      <UIKitSectionTitle>{t('uikit.foundation.typography')}</UIKitSectionTitle>
      <Card style={styles.stack}>
        {TYPE_VARIANTS.map((variant) => (
          <View key={variant} style={styles.typeRow}>
            <Text variant={variant} style={styles.typeSample} numberOfLines={1}>
              {variant}
            </Text>
            <Text variant="caption" color="tertiary">
              {typography[variant].fontSize}
            </Text>
          </View>
        ))}
      </Card>

      <UIKitSectionTitle>{t('uikit.foundation.spacing')}</UIKitSectionTitle>
      <Card style={styles.stack}>
        {([1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8] as const).map((space) => (
          <View key={space} style={styles.spaceRow}>
            <Text variant="caption" style={styles.spaceLabel}>
              {space} · {theme.space[space]}
            </Text>
            <View style={[styles.spaceBar, { width: theme.space[space] }]} />
          </View>
        ))}
      </Card>

      <UIKitSectionTitle>{t('uikit.foundation.radii')}</UIKitSectionTitle>
      <View style={styles.wrap}>
        {RADII.map((key) => (
          <View key={key} style={styles.swatchItem}>
            <View style={[styles.radiusBox, { borderRadius: theme.radius[key] }]} />
            <Text variant="caption">
              {key} · {theme.radius[key]}
            </Text>
          </View>
        ))}
      </View>

      <UIKitSectionTitle>{t('uikit.foundation.icons')}</UIKitSectionTitle>
      <Card style={styles.iconRow}>
        {ICON_NAMES.map((icon) => (
          <View key={icon} style={styles.iconItem}>
            <Icon name={icon} />
            <Text variant="micro" color="secondary" numberOfLines={1}>
              {icon}
            </Text>
          </View>
        ))}
      </Card>

      <UIKitSectionTitle>{t('uikit.foundation.surfaces')}</UIKitSectionTitle>
      <View style={styles.surfaceRow}>
        <Card style={styles.surfaceCard}>
          <Text variant="caption">{t('uikit.foundation.border')}</Text>
        </Card>
        <View style={[styles.surfaceCard, styles.shadowCard]}>
          <Text variant="caption">{t('uikit.foundation.shadow')}</Text>
        </View>
      </View>

      <Text variant="footnote" color="secondary">
        {t('uikit.foundation.safeAreas')}
      </Text>
    </UIKitScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[3] },
  swatchItem: { width: 72, gap: theme.space[1] },
  swatch: {
    height: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  radiusBox: {
    height: 56,
    backgroundColor: theme.colors.bg.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  stack: { gap: theme.space[2] },
  typeRow: { flexDirection: 'row', alignItems: 'baseline', gap: theme.space[3] },
  typeSample: { flex: 1 },
  spaceRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  spaceLabel: { width: 64 },
  spaceBar: {
    height: theme.space[2],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent.default,
  },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[3] },
  iconItem: { width: 64, alignItems: 'center', gap: theme.space[1] },
  surfaceRow: { flexDirection: 'row', gap: theme.space[3] },
  surfaceCard: { flex: 1, minHeight: 80, justifyContent: 'center', alignItems: 'center' },
  shadowCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.bg.elevated,
    boxShadow: theme.shadow.bubble,
  },
}));
