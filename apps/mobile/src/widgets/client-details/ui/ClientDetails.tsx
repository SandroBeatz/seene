/**
 * Client details widget — proves the read + derived pipeline: the client row plus the
 * new-vs-returning derivation from the appointment count. Fuller editing lands in the
 * Phase 4 client-details sheet.
 */
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { useClientAppointmentCountQuery } from '@/entities/appointment';
import { isNewClient, useClientQuery } from '@/entities/client';
import { useUserId } from '@/entities/session';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { Card, ErrorState, Screen, ScreenScrollView, Skeleton, Text } from '@/shared/ui';

export function ClientDetails({ clientId }: { clientId: string }) {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const client = useClientQuery(clientId);
  const appointmentCount = useClientAppointmentCountQuery(userId, clientId);

  if (client.isPending) {
    return (
      <Screen padded>
        <Skeleton height={120} />
      </Screen>
    );
  }

  if (client.isError || !client.data) {
    return (
      <Screen>
        <ErrorState
          message={
            client.error ? t(errorMessageKey(normalizeError(client.error))) : t('clients.notFound')
          }
          onRetry={() => void client.refetch()}
        />
      </Screen>
    );
  }

  const c = client.data;
  const name = c.last_name ? `${c.first_name} ${c.last_name}` : c.first_name;
  const standing =
    appointmentCount.data === undefined
      ? undefined
      : isNewClient(appointmentCount.data)
        ? t('clients.new')
        : t('clients.returning');

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <Card>
        <Text variant="title3">{name}</Text>
        {standing ? (
          <Text variant="footnote" color="secondary">
            {standing}
          </Text>
        ) : null}
      </Card>

      <Card>
        {c.phone ? <Row label={t('clients.phone')} value={c.phone} /> : null}
        {c.notes ? <Row label={t('clients.notes')} value={c.notes} /> : null}
      </Card>
    </ScreenScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <Text variant="footnote" color="tertiary">
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[4], padding: theme.space[4] },
}));
