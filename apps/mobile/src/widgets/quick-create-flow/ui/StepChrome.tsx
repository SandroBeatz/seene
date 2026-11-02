/**
 * The top of a "Новая запись" step (design "Запись · N из 4"): the shared flow chrome
 * titled "Новая запись" on step 1, then the chosen client with VIP.
 */
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { Client } from '@/entities/client';
import { clientName } from '@/entities/client';
import { Avatar, FlowStepChrome, Text, VipBadge } from '@/shared/ui';

export const STEP_COUNT = 4;

export interface StepChromeProps {
  /** 1…4 */
  step: number;
  /** What this step asks ("Услуги", "Дата и время"). */
  subtitle: string;
  client: Client | null;
}

export function StepChrome({ step, subtitle, client }: StepChromeProps) {
  const { t } = useTranslation();
  return (
    <FlowStepChrome
      step={step}
      count={STEP_COUNT}
      subtitle={subtitle}
      title={
        client ? (
          <View style={styles.clientLine}>
            <Avatar name={clientName(client)} color={client.avatar_color} size="sm" />
            <Text variant="headline" numberOfLines={1} style={styles.shrink}>
              {clientName(client)}
            </Text>
            {client.is_favorite ? (
              <VipBadge accessibilityLabel={t('clients.list.vipA11y')} />
            ) : null}
          </View>
        ) : (
          t('quickCreate.title')
        )
      }
      closeLabel={t('common.close')}
      backLabel={t('common.back')}
      progressLabel={t('quickCreate.progressA11y', { step, count: STEP_COUNT })}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  clientLine: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1.5] },
  shrink: { flexShrink: 1 },
}));
