/**
 * Moving personal time: the same fields as creating it, opened on its day with its
 * length and its own time left free. Nothing changed, nothing saved.
 */
import { useEffect } from 'react';
import { router } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  useTimeBlockQuery,
  useUpdateTimeBlockMutation,
  type TimeBlock,
} from '@/entities/time-block';
import { FlowStepFooter, SheetChrome, Skeleton, useNow } from '@/shared/ui';
import { usePersonalTimeDraft } from '../model/draft.store';
import { draftOfBlock, staysInPlace } from '../model/record';
import { usePersonalTime } from '../model/usePersonalTime';
import { TimeFields } from './TimeFields';

export function TimeBlockMoveSheet({ blockId }: { blockId: string }) {
  const { t } = useTranslation();
  const { ctx, draft } = usePersonalTime();
  const block = useTimeBlockQuery(ctx.userId, blockId).data;
  const now = useNow();
  const begin = usePersonalTimeDraft((s) => s.begin);
  const reset = usePersonalTimeDraft((s) => s.reset);
  const { zone, isPending } = ctx;

  const todayKey = DateTime.fromMillis(now, { zone }).toISODate()!;
  // Set once per opening: a save refreshes the block, and that must not start it over.
  const startedFor = draft.blockId;
  useEffect(() => {
    if (!block || isPending || startedFor === block.id) return;
    const from = draftOfBlock(block, zone);
    begin(block.id, { ...from, dayKey: from.dayKey >= todayKey ? from.dayKey : todayKey });
  }, [block, isPending, startedFor, zone, todayKey, begin]);
  useEffect(() => reset, [reset]);

  return (
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('personalTime.actions.reschedule')} leadingLabel={t('common.close')} />
      {block && draft.blockId === block.id ? (
        <MoveForm block={block} />
      ) : (
        <View style={styles.loading}>
          <Skeleton height={320} radius={16} />
        </View>
      )}
    </View>
  );
}

function MoveForm({ block }: { block: TimeBlock }) {
  const { t } = useTranslation();
  const { ctx, draft, dayLabel, span, record } = usePersonalTime();
  const update = useUpdateTimeBlockMutation(ctx.userId);

  const save = () => {
    if (!record) return;
    if (staysInPlace(block, record)) return router.back();
    update.mutate(
      { id: block.id, ...record },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
      },
    );
  };

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <TimeFields
          excludeId={block.id}
          onOpenMonth={() =>
            router.push({
              pathname: '/time-block/[blockId]/month',
              params: { blockId: block.id },
            })
          }
          onOpenOwnTime={() =>
            router.push({
              pathname: '/time-block/[blockId]/custom-time',
              params: { blockId: block.id },
            })
          }
        />
      </ScrollView>
      <FlowStepFooter
        title={
          draft.allDay
            ? `${dayLabel} · ${t('personalTime.when.allDayShort')}`
            : span
              ? `${dayLabel} · ${span}`
              : t('quickCreate.time.pick')
        }
        actionLabel={t('personalTime.actions.reschedule')}
        actionIcon="check"
        disabled={!record}
        loading={update.isPending}
        onAction={save}
      />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  loading: { paddingTop: 100, paddingHorizontal: theme.space[4] },
  content: {
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[4],
    paddingBottom: 150,
  },
}));
