/**
 * "Личное время · 2 из 2: что за дело" (design "AppNewBreakWhat"): a name — typed or
 * one of the quick picks — and "Создать", which closes the time for online booking
 * and puts it in the schedule. The name is optional: without it the schedule says
 * "Личное время".
 */
import { useTranslation } from 'react-i18next';
import { Alert, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useCreateTimeBlockMutation } from '@/entities/time-block';
import { Chip, FlowStepFooter, Text, useCloseFlow } from '@/shared/ui';
import { usePersonalTime } from '../model/usePersonalTime';
import { PersonalTimeChrome } from './PersonalTimeChrome';

const TITLE_MAX_LENGTH = 60;

export function WhatStep() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const { ctx, draft, dayLabel, span, record } = usePersonalTime();
  const create = useCreateTimeBlockMutation(ctx.userId);
  const close = useCloseFlow();
  const presets = t('personalTime.what.presets', { returnObjects: true }) as string[];

  const submit = () => {
    if (!record) return;
    create.mutate(record, {
      onSuccess: close,
      onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
    });
  };

  const name = draft.title.trim() || t('personalTime.title');

  return (
    <View style={styles.root} collapsable={false}>
      <PersonalTimeChrome step={2} subtitle={t('personalTime.what.subtitle')} />

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={110}>
        <View style={styles.field}>
          <Text variant="footnote" color="tertiary">
            {t('personalTime.what.name')}
          </Text>
          <TextInput
            accessibilityLabel={t('personalTime.what.name')}
            value={draft.title}
            onChangeText={draft.setTitle}
            placeholder={t('personalTime.what.namePlaceholder')}
            placeholderTextColor={theme.colors.content.tertiary}
            maxLength={TITLE_MAX_LENGTH}
            returnKeyType="done"
            style={styles.input}
          />
        </View>

        <View style={styles.group}>
          <Text variant="footnote" color="tertiary">
            {t('personalTime.what.quick')}
          </Text>
          <View style={styles.chips}>
            {presets.map((preset) => (
              <Chip
                key={preset}
                shape="pill"
                label={preset}
                selected={draft.title.trim() === preset}
                onPress={() => draft.setTitle(preset)}
              />
            ))}
          </View>
        </View>
      </KeyboardAwareScrollView>

      <FlowStepFooter
        title={`${name} · ${span ?? t('personalTime.when.allDayShort')}`}
        subtitle={dayLabel}
        actionLabel={t('personalTime.what.create')}
        actionIcon="check"
        disabled={!record}
        loading={create.isPending}
        onAction={submit}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  scroll: { flex: 1 },
  content: {
    paddingTop: theme.space[4],
    paddingHorizontal: theme.space[4],
    paddingBottom: 150,
    gap: theme.space[4.5],
  },
  field: {
    minHeight: 58,
    justifyContent: 'center',
    gap: 2,
    paddingVertical: theme.space[2.5],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.surface,
  },
  input: {
    padding: 0,
    color: theme.colors.content.primary,
    ...theme.typography.bodyLarge,
  },
  group: { gap: theme.space[1.5] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[1.5] },
}));
