/**
 * Personal time from the schedule, in the shape of the visit preview: what it is and
 * when — each row goes to where it changes — "Перенести" below and "Удалить" in the bar.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { useTimeBlockQuery } from '@/entities/time-block';
import { useTimeContext } from '@/features/pick-time';
import { useTimeBlockActions } from '@/features/time-block-actions';
import { formatDurationLabel } from '@/shared/lib/i18n';
import { ActionBar, EmptyState, InfoRow, SheetChrome, Skeleton, Text, useNow } from '@/shared/ui';

export function TimeBlockPreview({ blockId }: { blockId: string }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ctx = useTimeContext();
  const now = useNow();
  const query = useTimeBlockQuery(ctx.userId, blockId);
  const actions = useTimeBlockActions({ onDeleted: () => router.back() });
  const block = query.data;
  const name = block?.notes?.trim();

  const minutes = block
    ? (new Date(block.end_at).getTime() - new Date(block.start_at).getTime()) / 60_000
    : 0;

  return (
    <View style={styles.root} collapsable={false}>
      <SheetChrome
        title={t('personalTime.title')}
        leadingLabel={t('common.close')}
        action={
          block
            ? {
                key: 'delete',
                label: t('personalTime.actions.delete'),
                sf: 'trash',
                icon: 'trash',
                destructive: true,
                onPress: () => actions.run(block, 'delete'),
              }
            : undefined
        }
      />
      {block ? (
        <>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[styles.content, { paddingBottom: 116 + insets.bottom }]}
            showsVerticalScrollIndicator={false}>
            <InfoRow
              icon="pencil"
              caption={t('personalTime.what.name')}
              title={
                <Text variant="bodyStrong" color={name ? undefined : 'tertiary'} numberOfLines={2}>
                  {name || t('personalTime.preview.unnamed')}
                </Text>
              }
              accessibilityLabel={t('personalTime.actions.rename')}
              onPress={() => actions.run(block, 'rename')}
            />
            <InfoRow
              icon="calendar"
              title={<Text variant="bodyStrong">{ctx.dayLabel(ctx.dayKeyOf(block.start_at))}</Text>}
              subtitle={
                <Text variant="footnote" color="tertiary" tabularNums>
                  {block.all_day
                    ? t('personalTime.when.allDay')
                    : `${ctx.range(block.start_at, minutes)} · ${formatDurationLabel(minutes, t)}`}
                </Text>
              }
              accessibilityLabel={t('personalTime.actions.reschedule')}
              onPress={() => actions.run(block, 'reschedule')}
            />
            {new Date(block.end_at).getTime() > now ? (
              <Text variant="footnote" color="tertiary" style={styles.hint}>
                {t(
                  block.all_day ? 'personalTime.when.closedDay' : 'personalTime.preview.closedSpan',
                )}
              </Text>
            ) : null}
          </ScrollView>

          <ActionBar
            primary={{
              label: t('personalTime.actions.reschedule'),
              icon: 'reschedule',
              onPress: () => actions.run(block, 'reschedule'),
            }}
            bottom={Math.max(insets.bottom - 6, 16)}
          />
        </>
      ) : query.isPending || actions.isDeleting ? (
        <View style={styles.loading}>
          <Skeleton height={140} radius={16} />
        </View>
      ) : (
        <EmptyState title={t('personalTime.preview.missing')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  content: { paddingTop: theme.space[3], paddingHorizontal: theme.space[4], gap: theme.space[3] },
  loading: { paddingTop: 100, paddingHorizontal: theme.space[4] },
  hint: { paddingHorizontal: theme.space[1] },
}));
