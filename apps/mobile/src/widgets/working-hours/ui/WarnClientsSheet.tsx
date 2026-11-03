/**
 * After saving a day off: the clients with visits on those days, each a tap from a
 * prefilled WhatsApp chat. The design has no screen for this, only the promise under the
 * switch; automatic sending waits for a message provider.
 */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useAppointmentsRangeQuery } from '@/entities/appointment';
import { useClientsQuery } from '@/entities/client';
import { useTimeContext } from '@/features/pick-time';
import { whatsappUrl } from '@/shared/lib/phone';
import { GroupedCard, Icon, ListItem, SheetChrome, Text } from '@/shared/ui';
import { isAffectedVisit } from '../lib/visits';

export function WarnClientsSheet() {
  const { t } = useTranslation();
  const { from, to } = useLocalSearchParams<{ from: string; to: string }>();
  const ctx = useTimeContext();
  const visits = useAppointmentsRangeQuery(ctx.userId, from, to);
  const clients = useClientsQuery(ctx.userId);
  const [now] = useState(() => new Date());
  const [messaged, setMessaged] = useState<ReadonlySet<string>>(new Set());
  const affected = (visits.data ?? []).filter((visit) => isAffectedVisit(visit, now));
  const clientOf = (id: string) => clients.data?.find((client) => client.id === id);

  const failed = () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage'));
  const open = (visitId: string, phone: string | null | undefined, text: string) => {
    if (!phone) return Alert.alert(t('actions.noPhone'));
    setMessaged((done) => new Set(done).add(visitId));
    void Linking.openURL(whatsappUrl(phone, text)).catch(failed);
  };

  return (
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('menuHome.hours.warnTitle')} leadingLabel={t('common.close')} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {affected.length ? (
          <>
            <GroupedCard>
              {affected.map((visit) => {
                const client = clientOf(visit.client_id);
                const name = client?.first_name || t('menuHome.hours.clientFallback');
                const when = `${ctx.dayLabel(ctx.dayKeyOf(visit.start_at))}, ${ctx.time(visit.start_at)}`;
                return (
                  <ListItem
                    key={visit.id}
                    inset={false}
                    title={name}
                    subtitle={when}
                    accessibilityLabel={t('menuHome.hours.warnMessageA11y', { name })}
                    showChevron={false}
                    right={
                      <Icon
                        name={messaged.has(visit.id) ? 'check' : 'whatsapp'}
                        size="md"
                        color="content.secondary"
                      />
                    }
                    onPress={() =>
                      open(
                        visit.id,
                        client?.phone,
                        t('menuHome.hours.warnMessage', { name, when }),
                      )
                    }
                  />
                );
              })}
            </GroupedCard>
            <Text variant="caption" color="tertiary" style={styles.hint}>
              {t('menuHome.hours.warnListHint')}
            </Text>
          </>
        ) : visits.isPending ? null : (
          <Text variant="body" color="secondary" align="center">
            {t('menuHome.hours.warnEmpty')}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1 },
  content: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.space[2],
    paddingBottom: theme.space[6],
  },
  hint: { marginTop: theme.space[2], marginHorizontal: theme.space[1] },
}));
