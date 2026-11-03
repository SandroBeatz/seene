/** "Помощь" (design AppMenuHelp). "Частые вопросы" joins when their text is ready. */
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { SITE_URL } from '@/shared/config/site';
import { SUPPORT_WHATSAPP } from '@/shared/config/support';
import { appVersionLabel } from '@/shared/lib/app-version';
import { whatsappUrl } from '@/shared/lib/phone';
import { MenuGroup, MenuRow, ScreenScrollView, Text } from '@/shared/ui';

export function HelpScreen() {
  const { t, i18n } = useTranslation();
  // The site's default language has no prefix.
  const legalUrl = (page: string) =>
    i18n.language === 'en' ? `${SITE_URL}/${page}` : `${SITE_URL}/${i18n.language}/${page}`;

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <MenuGroup>
        <MenuRow
          icon="whatsapp"
          title={t('menuHome.help.support')}
          value="WhatsApp"
          onPress={() => void Linking.openURL(whatsappUrl(SUPPORT_WHATSAPP))}
        />
        <MenuRow
          icon="bulb"
          title={t('menuHome.help.suggest')}
          onPress={() =>
            void Linking.openURL(whatsappUrl(SUPPORT_WHATSAPP, t('menuHome.help.suggestText')))
          }
        />
      </MenuGroup>
      <Text variant="caption" color="tertiary" style={styles.note}>
        {t('menuHome.help.hours')}
      </Text>

      <MenuGroup label={t('menuHome.help.documents')}>
        <MenuRow
          icon="document"
          title={t('menuHome.help.terms')}
          onPress={() => void WebBrowser.openBrowserAsync(legalUrl('terms'))}
        />
        <MenuRow
          icon="document"
          title={t('menuHome.help.privacy')}
          onPress={() => void WebBrowser.openBrowserAsync(legalUrl('privacy'))}
        />
      </MenuGroup>

      <Text variant="caption" color="tertiary" align="center" style={styles.version}>
        {appVersionLabel()}
      </Text>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingHorizontal: theme.space[5], paddingTop: 0, paddingBottom: theme.space[10] },
  note: { marginTop: theme.space[2], marginHorizontal: theme.space[1] },
  version: { marginTop: theme.space[4.5] },
}));
