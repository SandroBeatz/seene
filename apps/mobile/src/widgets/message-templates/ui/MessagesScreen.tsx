/**
 * "Напоминания" (design AppMenuMessages). Messages go by hand from the master's WhatsApp, so a
 * template's subtitle says when the app offers it. Left out for now: the daily reminder and its
 * time, which need push (phase 10). The editor is a sheet: the design has none.
 */
import { router } from 'expo-router';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useMasterSettingsQuery } from '@/entities/master';
import {
  MESSAGE_KINDS,
  templateBody,
  templateSegments,
  useMessageTemplatesQuery,
  type MessageKind,
} from '@/entities/message-template';
import { useUserId } from '@/entities/session';
import { MenuGroup, MenuRow, SectionLabel, Text } from '@/shared/ui';
import { useShownLanguage } from './useShownLanguage';
import { useVariableLabels } from './useVariableLabels';

export function MessagesScreen() {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const settings = useMasterSettingsQuery(userId);
  const templates = useMessageTemplatesQuery(userId);
  const labels = useVariableLabels();
  const language = useShownLanguage();
  const setting = settings.data?.message_language ?? 'auto';

  const card = (kind: MessageKind) => {
    const title = t(`menuHome.messages.kinds.${kind}.title`);
    return (
      <View key={kind} style={styles.card}>
        <View style={styles.head}>
          <View style={styles.titles}>
            <Text variant="bodyStrong">{title}</Text>
            <Text variant="caption" color="tertiary">
              {t(`menuHome.messages.kinds.${kind}.when`)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('menuHome.messages.editA11y', { title })}
            onPress={() => router.push({ pathname: '/messages/[kind]', params: { kind } })}
            style={({ pressed }) => [styles.edit, pressed && styles.pressed]}>
            <Text variant="footnoteStrong">{t('menuHome.messages.edit')}</Text>
          </Pressable>
        </View>
        <View style={styles.body}>
          <Text variant="subhead">
            {templateSegments(templateBody(templates.data, kind, language)).map(
              (segment, index) => (
                <Fragment key={index}>
                  {segment.variable ? (
                    <Text variant="subheadMedium" style={styles.variable}>
                      {labels[segment.variable]}
                    </Text>
                  ) : (
                    segment.text
                  )}
                </Fragment>
              ),
            )}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.root}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      <MenuGroup>
        <MenuRow
          icon="globe"
          title={t('menuHome.messages.language')}
          value={t(`menuHome.messages.languages.${setting}`)}
          onPress={() => router.push('/messages/language')}
        />
      </MenuGroup>
      <Text variant="caption" color="tertiary" style={styles.hint}>
        {t(setting === 'auto' ? 'menuHome.messages.autoHint' : 'menuHome.messages.fixedHint')}
      </Text>
      <View style={styles.section}>
        <SectionLabel label={t('menuHome.messages.templates')} />
      </View>
      <View style={styles.cards}>{MESSAGE_KINDS.map(card)}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  content: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.space[2],
    paddingBottom: theme.space[6],
  },
  hint: { marginTop: theme.space[2], marginHorizontal: theme.space[1] },
  section: { marginTop: theme.space[5], marginBottom: theme.space[2] },
  cards: { gap: theme.space[2.5] },
  card: {
    backgroundColor: theme.colors.bg.surface,
    borderRadius: theme.radius.xl,
    padding: theme.space[3.5],
    gap: theme.space[2.5],
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.space[2] },
  titles: { flex: 1, minWidth: 0, gap: 2 },
  edit: {
    height: 32,
    paddingHorizontal: theme.space[3],
    borderRadius: 16,
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.canvas,
  },
  pressed: { opacity: 0.6 },
  body: {
    backgroundColor: theme.colors.bg.canvas,
    borderRadius: theme.radius.field,
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[3.5],
  },
  variable: { color: theme.colors.brand.text },
}));
