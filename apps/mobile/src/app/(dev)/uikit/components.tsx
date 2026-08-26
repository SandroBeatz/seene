import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { AppointmentStatusColorKey } from '@/shared/theme/tokens';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  ErrorState,
  Icon,
  IconButton,
  Input,
  ListItem,
  Skeleton,
  SkeletonList,
  StatusPill,
  Switch,
  Text,
} from '@/shared/ui';
import { UIKitScreen, UIKitSectionTitle } from '@/widgets/uikit-catalog';

const STATUSES: AppointmentStatusColorKey[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'expired',
];

export default function UIKitComponentsScreen() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(true);
  const [chip, setChip] = useState('all');

  return (
    <UIKitScreen>
      <UIKitSectionTitle>{t('uikit.components.buttons')}</UIKitSectionTitle>
      <View style={styles.row}>
        <Button label={t('uikit.labels.primary')} onPress={() => undefined} />
        <Button label={t('uikit.labels.secondary')} variant="secondary" onPress={() => undefined} />
        <Button label={t('common.delete')} variant="danger" onPress={() => undefined} />
      </View>
      <View style={styles.row}>
        <IconButton
          icon="add"
          accessibilityLabel={t('uikit.labels.add')}
          variant="accent"
          onPress={() => undefined}
        />
        <IconButton icon="edit" accessibilityLabel={t('common.edit')} onPress={() => undefined} />
        <IconButton
          icon="search"
          accessibilityLabel={t('common.search')}
          variant="glass"
          onPress={() => undefined}
        />
      </View>

      <UIKitSectionTitle>{t('uikit.components.inputs')}</UIKitSectionTitle>
      <Input label={t('onboarding.name')} placeholder={t('uikit.components.namePlaceholder')} />
      <Input
        label={t('auth.email')}
        placeholder={t('uikit.components.emailPlaceholder')}
        error={t('auth.errors.email')}
      />
      <View style={styles.row}>
        <Text variant="body">{t('uikit.labels.selector')}</Text>
        <Switch value={enabled} onValueChange={setEnabled} />
      </View>
      <View style={styles.row}>
        {['all', 'hair', 'nails'].map((item) => (
          <Chip
            key={item}
            label={t(`uikit.labels.${item}`)}
            selected={chip === item}
            onPress={() => setChip(item)}
          />
        ))}
      </View>

      <UIKitSectionTitle>{t('uikit.components.cards')}</UIKitSectionTitle>
      <Card padding="none">
        <ListItem
          title={t('navigation.profileSettings')}
          subtitle={t('placeholders.profileSettings')}
          left={<Icon name="settings" />}
          onPress={() => undefined}
        />
        <Divider inset />
        <ListItem title={t('tabs.clients')} showChevron={false} />
      </Card>
      <View style={styles.row}>
        <Badge label={t('uikit.labels.new')} tone="accent" />
        <Badge label={t('uikit.labels.paid')} tone="success" />
        <Badge label={t('uikit.labels.warning')} tone="warning" />
      </View>
      <View style={styles.row}>
        {STATUSES.map((status) => (
          <StatusPill key={status} status={status} label={status} />
        ))}
      </View>

      <UIKitSectionTitle>{t('uikit.components.states')}</UIKitSectionTitle>
      <Card style={styles.stack}>
        <Skeleton width="60%" height={22} />
        <SkeletonList rows={2} />
      </Card>
      <View style={styles.stateBox}>
        <EmptyState
          title={t('states.empty')}
          description={t('placeholders.clients')}
          actionLabel={t('uikit.labels.add')}
          onAction={() => undefined}
        />
      </View>
      <View style={styles.stateBox}>
        <ErrorState onRetry={() => undefined} />
      </View>
    </UIKitScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.space[2] },
  stack: { gap: theme.space[3] },
  stateBox: {
    minHeight: 220,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.bg.surface,
  },
}));
