/**
 * "Личное время · 2 из 2: что за дело" (design "AppNewBreakWhat"): a name — typed or
 * one of the quick picks — and "Создать", which closes the time for online booking
 * and puts it in the schedule. The name is optional: without it the schedule says
 * "Личное время".
 */
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StyleSheet } from 'react-native-unistyles';
import { useCreateTimeBlockMutation } from '@/entities/time-block';
import { FlowStepFooter, useCloseFlow, showFailedToast, showToast } from '@/shared/ui';
import { usePersonalTime } from '../model/usePersonalTime';
import { NameFields } from './NameFields';
import { PersonalTimeChrome } from './PersonalTimeChrome';

export function WhatStep() {
  const { t } = useTranslation();
  const { ctx, draft, dayLabel, span, record } = usePersonalTime();
  const create = useCreateTimeBlockMutation(ctx.userId);
  const close = useCloseFlow();

  const submit = () => {
    if (!record) return;
    create.mutate(record, {
      onSuccess: () => {
        showToast({ title: t('toasts.personalTimeAdded'), summary: `${dayLabel}, ${span}` });
        close();
      },
      onError: () => showFailedToast(submit),
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
        <NameFields value={draft.title} onChange={draft.setTitle} />
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
}));
