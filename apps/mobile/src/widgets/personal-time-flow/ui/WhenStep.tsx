/**
 * "Личное время · 1 из 2: когда" (design "AppNewBreak"): the time fields, and the bar
 * says what gets closed for online booking.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { FlowStepFooter } from '@/shared/ui';
import { usePersonalTime } from '../model/usePersonalTime';
import { PersonalTimeChrome } from './PersonalTimeChrome';
import { TimeFields } from './TimeFields';

export function WhenStep() {
  const { t } = useTranslation();
  const { draft, summary, record } = usePersonalTime();

  return (
    <View style={styles.root} collapsable={false}>
      <PersonalTimeChrome step={1} subtitle={t('personalTime.when.subtitle')} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <TimeFields
          onOpenMonth={() => router.push('/personal-time/month')}
          onOpenOwnTime={() => router.push('/personal-time/custom-time')}
        />
      </ScrollView>

      <FlowStepFooter
        title={summary}
        subtitle={t(draft.allDay ? 'personalTime.when.closedDay' : 'personalTime.when.closedSpan')}
        actionLabel={t('quickCreate.next')}
        disabled={!record}
        onAction={() => router.push('/personal-time/what')}
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
