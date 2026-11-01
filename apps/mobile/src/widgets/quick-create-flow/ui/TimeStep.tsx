/**
 * "Новая запись · 3 из 4: день и окно" (design "AppNewTime"): the shared day and time
 * picker under the step's bar, and what's chosen in the footer.
 */
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { DayTimePicker } from '@/features/pick-time';
import { formatDurationLabel } from '@/shared/lib/i18n';
import { FlowStepFooter } from '@/shared/ui';
import { useFlowData } from '../model/useFlowData';
import { StepChrome } from './StepChrome';

export function TimeStep() {
  const flow = useFlowData();
  const { t, draft } = flow;
  const chosen = draft.start;

  return (
    <View style={styles.root} collapsable={false}>
      <StepChrome step={3} subtitle={t('quickCreate.time.subtitle')} client={flow.client} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <DayTimePicker
          duration={flow.duration}
          dayKey={draft.dayKey}
          start={chosen}
          ownTime={draft.ownTime}
          onDay={draft.setDay}
          onStart={draft.setStart}
          onOpenMonth={() => router.push('/quick-create/month')}
          onOpenOwnTime={() => router.push('/quick-create/custom-time')}
        />
      </ScrollView>

      <FlowStepFooter
        title={
          chosen
            ? `${flow.dayLabel(flow.dayKeyOf(chosen))}, ${flow.range(chosen)}`
            : t('quickCreate.time.pick')
        }
        subtitle={`${formatDurationLabel(flow.duration, t)} · ${flow.picked.map((s) => s.name).join(', ')}`}
        actionLabel={t('quickCreate.next')}
        disabled={!chosen}
        onAction={() => router.push('/quick-create/review')}
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
  },
}));
