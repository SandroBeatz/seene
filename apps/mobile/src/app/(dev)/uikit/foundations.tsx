import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Card, Icon, Text } from '@/shared/ui';
import { UIKitScreen, UIKitSectionTitle } from '@/widgets/uikit-catalog';

export default function UIKitFoundationsScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const colors = [
    ['canvas', theme.colors.bg.canvas],
    ['surface', theme.colors.bg.surface],
    ['elevated', theme.colors.bg.elevated],
    ['accent', theme.colors.accent.default],
    ['success', theme.colors.feedback.success],
    ['danger', theme.colors.feedback.danger],
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

      <UIKitSectionTitle>{t('uikit.foundation.typography')}</UIKitSectionTitle>
      <Card style={styles.stack}>
        <Text variant="display">{t('uikit.foundation.typeSamples.display')}</Text>
        <Text variant="title1">{t('uikit.foundation.typeSamples.title1')}</Text>
        <Text variant="title3">{t('uikit.foundation.typeSamples.title3')}</Text>
        <Text variant="body">{t('uikit.foundation.typeSamples.body')}</Text>
        <Text variant="caption">{t('uikit.foundation.typeSamples.caption')}</Text>
      </Card>

      <UIKitSectionTitle>{t('uikit.foundation.spacing')}</UIKitSectionTitle>
      <Card style={styles.stack}>
        {[1, 2, 3, 4, 6, 8].map((space) => (
          <View key={space} style={styles.spaceRow}>
            <Text variant="caption">space.{space}</Text>
            <View
              style={[styles.spaceBar, { width: theme.space[space as keyof typeof theme.space] }]}
            />
          </View>
        ))}
      </Card>

      <UIKitSectionTitle>{t('uikit.foundation.icons')}</UIKitSectionTitle>
      <Card style={styles.iconRow}>
        {(['home', 'calendar', 'clients', 'analytics', 'settings', 'add'] as const).map((icon) => (
          <View key={icon} style={styles.iconItem}>
            <Icon name={icon} />
            <Text variant="caption">{icon}</Text>
          </View>
        ))}
      </Card>

      <UIKitSectionTitle>{t('uikit.foundation.surfaces')}</UIKitSectionTitle>
      <View style={styles.surfaceRow}>
        <Card style={styles.surfaceCard}>
          <Text variant="caption">{t('uikit.foundation.border')}</Text>
        </Card>
        <Card elevated style={styles.surfaceCard}>
          <Text variant="caption">{t('uikit.foundation.shadow')}</Text>
        </Card>
      </View>

      <Text variant="footnote" color="secondary">
        {t('uikit.foundation.safeAreas')}
      </Text>
    </UIKitScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[3] },
  swatchItem: { width: 88, gap: theme.space[1] },
  swatch: {
    height: 52,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border.default,
  },
  stack: { gap: theme.space[2] },
  spaceRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  spaceBar: {
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.accent.default,
  },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[4] },
  iconItem: { alignItems: 'center', gap: theme.space[1] },
  surfaceRow: { flexDirection: 'row', gap: theme.space[3] },
  surfaceCard: { flex: 1, minHeight: 80, justifyContent: 'center', alignItems: 'center' },
}));
