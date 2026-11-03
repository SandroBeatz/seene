/** Editing one template; the design has no screen for it. Variables go in at the cursor. */
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  BODY_MAX_LENGTH,
  DEFAULT_TEMPLATES,
  MESSAGE_KINDS,
  fromEditable,
  labelToken,
  templateBody,
  toEditable,
  useMessageTemplatesQuery,
  useSaveMessageTemplateMutation,
  variablesOf,
  type MessageKind,
} from '@/entities/message-template';
import { useUserId } from '@/entities/session';
import { Button, Chip, ChipRow, FormScreen, Input, SheetChrome, Text } from '@/shared/ui';
import { useShownLanguage } from './useShownLanguage';
import { useVariableLabels } from './useVariableLabels';

const isKind = (value: string): value is MessageKind =>
  (MESSAGE_KINDS as readonly string[]).includes(value);

export function MessageTemplateSheet() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const userId = useUserId() ?? '';
  const templates = useMessageTemplatesQuery(userId);
  const language = useShownLanguage();
  if (!isKind(kind) || templates.isPending) return null;
  return (
    <TemplateForm
      key={`${kind}-${language}`}
      kind={kind}
      body={templateBody(templates.data, kind, language)}
      language={language}
      userId={userId}
    />
  );
}

function TemplateForm({
  kind,
  body,
  language,
  userId,
}: {
  kind: MessageKind;
  body: string;
  language: ReturnType<typeof useShownLanguage>;
  userId: string;
}) {
  const { t } = useTranslation();
  const labels = useVariableLabels();
  const save = useSaveMessageTemplateMutation(userId);
  const [text, setText] = useState(() => toEditable(body, labels));
  const cursor = useRef<{ start: number; end: number } | null>(null);

  const standard = DEFAULT_TEMPLATES[language][kind];
  const options = {
    onSuccess: () => router.back(),
    onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
  };

  const insert = (label: string) => {
    const token = labelToken(label);
    const at = cursor.current ?? { start: text.length, end: text.length };
    setText(text.slice(0, at.start) + token + text.slice(at.end));
    const next = at.start + token.length;
    cursor.current = { start: next, end: next };
  };

  return (
    <FormScreen
      edges={['left', 'right', 'bottom']}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      footer={
        <Button
          label={t('common.save')}
          disabled={!text.trim()}
          loading={save.isPending}
          onPress={() =>
            save.mutate({ kind, language, body: fromEditable(text.trim(), labels) }, options)
          }
          fullWidth
        />
      }>
      <SheetChrome
        title={t(`menuHome.messages.kinds.${kind}.title`)}
        leadingLabel={t('common.close')}
        action={
          body !== standard
            ? {
                key: 'reset',
                label: t('menuHome.messages.reset'),
                sf: 'arrow.counterclockwise',
                icon: 'repeat',
                onPress: () => setText(toEditable(standard, labels)),
              }
            : undefined
        }
      />
      <Input
        variant="filled"
        accessibilityLabel={t(`menuHome.messages.kinds.${kind}.title`)}
        value={text}
        onChangeText={setText}
        onSelectionChange={(event) => {
          cursor.current = event.nativeEvent.selection;
        }}
        maxLength={BODY_MAX_LENGTH}
        multiline
        autoCapitalize="sentences"
      />
      <ChipRow>
        {variablesOf(kind).map((name) => (
          <Chip
            key={name}
            size="sm"
            shape="pill"
            label={`+ ${labels[name]}`}
            onPress={() => insert(labels[name])}
          />
        ))}
      </ChipRow>
      <Text variant="caption" color="tertiary">
        {t('menuHome.messages.editHint', {
          language: t(`menuHome.messages.languages.${language}`),
        })}
      </Text>
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingTop: theme.space[2], gap: theme.space[3] },
}));
