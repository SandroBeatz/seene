import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSessionStore } from '@/entities/session';
import { SUPPORTED_LOCALES, useLocaleStore } from '@/shared/lib/i18n';
import { type ThemeMode, useThemeStore } from '@/shared/theme/theme.store';
import { Button, Card, Chip, Screen, Text } from '@/shared/ui';

const THEME_MODES: ThemeMode[] = ['auto', 'light', 'dark'];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const signOut = useSessionStore((s) => s.signOut);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16 }}>
        <Text variant="title1">{t('tabs.settings')}</Text>

        <Card>
          <View style={{ gap: 8 }}>
            <Text variant="subhead" color="secondary">
              Theme
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {THEME_MODES.map((m) => (
                <Chip key={m} label={m} selected={mode === m} onPress={() => setMode(m)} />
              ))}
            </View>
          </View>
        </Card>

        <Card>
          <View style={{ gap: 8 }}>
            <Text variant="subhead" color="secondary">
              Language
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {SUPPORTED_LOCALES.map((l) => (
                <Chip key={l} label={l} selected={locale === l} onPress={() => setLocale(l)} />
              ))}
            </View>
          </View>
        </Card>

        <Button
          label={t('auth.logOut')}
          variant="danger"
          onPress={() => void signOut()}
          fullWidth
        />
      </ScrollView>
    </Screen>
  );
}
