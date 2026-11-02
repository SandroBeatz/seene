/** The booking page's link in the menu, with its QR code and the share sheet. */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { masterPageLabel } from '@/entities/master';
import { Icon, Text } from '@/shared/ui';
import { sharePage } from '../lib/share-page';

export function PageLinkCard({ username }: { username: string }) {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <View style={styles.text}>
        <View style={styles.label}>
          <View style={styles.dot} />
          <Text variant="caption" color="secondary" numberOfLines={1} style={styles.labelText}>
            {t('menuHome.pageLabel')}
          </Text>
        </View>
        <Text variant="subheadStrong" numberOfLines={1}>
          {masterPageLabel(username)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('menuHome.qrA11y')}
        onPress={() => router.push('/page-qr')}
        style={({ pressed }) => [styles.action, styles.qr, pressed && styles.pressed]}>
        <Icon name="qr" size="base" />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('menuHome.shareA11y')}
        onPress={() => sharePage(username)}
        style={({ pressed }) => [styles.action, styles.share, pressed && styles.pressed]}>
        <Icon name="share" size={17} color="accent.onAccent" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    marginTop: theme.space[4.5],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.bg.surface,
    paddingVertical: theme.space[3],
    paddingRight: theme.space[3],
    paddingLeft: theme.space[3.5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2.5],
  },
  text: { flex: 1, minWidth: 0, gap: theme.space[0.5] },
  label: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1.5] },
  labelText: { flexShrink: 1 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.feedback.success,
  },
  action: {
    width: theme.sizing.iconButton,
    height: theme.sizing.iconButton,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qr: { backgroundColor: theme.colors.bg.canvas },
  share: { backgroundColor: theme.colors.accent.default },
  pressed: { opacity: 0.6 },
}));
