/** Theme, language and sign-out, moved as they were from the menu; AppMenuSettings replaces this. */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useSessionStore } from '@/entities/session';
import { SUPPORTED_LOCALES, useLocaleStore } from '@/shared/lib/i18n';
import { type ThemeMode, useThemeStore } from '@/shared/theme/theme.store';
import { Button, Card, Chip, Divider, ScreenScrollView, Text } from '@/shared/ui';

const THEME_MODES: ThemeMode[] = ['auto', 'light', 'dark'];

export default function PreferencesScreen() {
  const { t } = useTranslation();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const signOut = useSessionStore((state) => state.signOut);

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.group}>
          <Text variant="subhead" color="secondary">
            {t('settings.theme')}
          </Text>
          <View style={styles.row}>
            {THEME_MODES.map((item) => (
              <Chip
                key={item}
                label={t(`settings.themeModes.${item}`)}
                selected={mode === item}
                onPress={() => setMode(item)}
              />
            ))}
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.group}>
          <Text variant="subhead" color="secondary">
            {t('settings.language')}
          </Text>
          <View style={styles.row}>
            {SUPPORTED_LOCALES.map((item) => (
              <Chip
                key={item}
                label={item.toUpperCase()}
                selected={locale === item}
                onPress={() => setLocale(item)}
              />
            ))}
          </View>
        </View>
      </Card>

      <Divider />
      <Button label={t('auth.logOut')} variant="danger" onPress={() => void signOut()} fullWidth />

      {__DEV__ ? (
        <Button
          label={t('uikit.openCatalog')}
          variant="ghost"
          onPress={() => router.push('/uikit')}
        />
      ) : null}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[4] },
  group: { gap: theme.space[2] },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] },
}));
