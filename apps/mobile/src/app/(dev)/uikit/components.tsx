import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { AppointmentStatusColorKey } from '@/shared/theme/tokens';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  CodeInput,
  EmptyState,
  ErrorState,
  GroupedCard,
  Icon,
  IconButton,
  Input,
  ListItem,
  SectionLabel,
  SegmentedControl,
  SelectionMark,
  SheetHeader,
  Skeleton,
  SkeletonList,
  StatusPill,
  StepHeader,
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

const DURATIONS = ['15 min', '30 min', '45 min', '1 h', '1:30', '2 h', '2:30', '3 h'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export default function UIKitComponentsScreen() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(true);
  const [manual, setManual] = useState(false);
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState(0);
  const [mode, setMode] = useState<'same' | 'days'>('same');
  const [duration, setDuration] = useState('1 h');
  const [days, setDays] = useState([true, true, true, true, true, true, false]);
  const [code, setCode] = useState('4817');
  const [username, setUsername] = useState('karina_nails');

  return (
    <UIKitScreen>
      <UIKitSectionTitle>{t('uikit.components.buttons')}</UIKitSectionTitle>
      <View style={styles.stack}>
        <Button label={t('uikit.labels.apple')} leftIcon="apple" onPress={() => undefined} />
        <Button
          label={t('uikit.labels.google')}
          variant="secondary"
          leftIcon={<Icon name="google" size="base" />}
          onPress={() => undefined}
        />
        <Button
          label={t('uikit.labels.emailLink')}
          variant="ghost"
          size="md"
          onPress={() => undefined}
        />
        <Button
          label={t('uikit.labels.later')}
          variant="ghost"
          tone="secondary"
          size="md"
          onPress={() => undefined}
        />
        <Button label={t('uikit.labels.chooseOne')} disabled />
        <Button label={t('uikit.labels.primary')} loading />
      </View>
      <View style={styles.row}>
        <IconButton
          icon="chevronLeft"
          accessibilityLabel={t('uikit.labels.back')}
          variant="neutral"
          onPress={() => undefined}
        />
        <IconButton
          icon="close"
          iconSize="sm"
          accessibilityLabel={t('common.close')}
          variant="neutral"
          onPress={() => undefined}
        />
        <IconButton
          icon="bell"
          size="lg"
          accessibilityLabel={t('uikit.labels.warning')}
          variant="neutral"
          onPress={() => undefined}
        />
        <IconButton
          icon="add"
          size="lg"
          accessibilityLabel={t('uikit.labels.add')}
          variant="accent"
          onPress={() => undefined}
        />
        <IconButton
          icon="search"
          accessibilityLabel={t('common.search')}
          variant="glass"
          onPress={() => undefined}
        />
      </View>

      <UIKitSectionTitle>{t('uikit.components.headers')}</UIKitSectionTitle>
      <Card style={styles.stack}>
        <StepHeader
          step={2}
          total={4}
          counterLabel={t('uikit.labels.stepCounter', { step: 2, total: 4 })}
          backLabel={t('uikit.labels.back')}
          onBack={() => undefined}
        />
      </Card>
      <Card padding="none" style={styles.sheetCard}>
        <SheetHeader
          title={t('uikit.labels.timezone')}
          leadingLabel={t('uikit.labels.close')}
          onLeadingPress={() => undefined}
        />
      </Card>

      <UIKitSectionTitle>{t('uikit.components.inputs')}</UIKitSectionTitle>
      <Input label={t('onboarding.name')} placeholder={t('uikit.components.namePlaceholder')} />
      <Input
        label={t('uikit.labels.username')}
        prefix={t('uikit.labels.usernamePrefix')}
        strong
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        below={
          <View style={styles.status}>
            <Icon name="check" size="sm" weight="heavy" color="feedback.success" />
            <Text variant="footnoteStrong" color="success">
              {t('uikit.labels.free')}
            </Text>
          </View>
        }
      />
      <Input
        label={t('auth.email')}
        size="lg"
        placeholder={t('uikit.components.emailPlaceholder')}
        error={t('auth.errors.email')}
      />
      <Input
        label={t('uikit.labels.price')}
        size="lg"
        strong
        focusRing
        keyboardType="number-pad"
        placeholder="0"
        suffix={t('uikit.labels.currencySuffix')}
      />
      <Input
        label={t('uikit.labels.description')}
        labelHint={t('uikit.labels.optional')}
        multiline
        placeholder={t('uikit.labels.descriptionPlaceholder')}
      />

      <UIKitSectionTitle>{t('uikit.components.code')}</UIKitSectionTitle>
      <CodeInput
        value={code}
        onChangeText={setCode}
        autoFocus={false}
        accessibilityLabel={t('uikit.labels.code')}
      />
      <CodeInput
        value="481700"
        onChangeText={() => undefined}
        autoFocus={false}
        error
        accessibilityLabel={t('uikit.labels.code')}
      />
      <Text variant="subhead" color="danger">
        {t('uikit.labels.codeError')}
      </Text>

      <UIKitSectionTitle>{t('uikit.components.selection')}</UIKitSectionTitle>
      <View style={styles.row}>
        <Pressable accessibilityRole="checkbox" onPress={() => setChecked((v) => !v)}>
          <SelectionMark checked={checked} shape="square" />
        </Pressable>
        <SelectionMark checked={false} shape="square" />
        {[0, 1].map((index) => (
          <Pressable key={index} accessibilityRole="radio" onPress={() => setRadio(index)}>
            <SelectionMark checked={radio === index} />
          </Pressable>
        ))}
        <View style={styles.photo}>
          <SelectionMark checked tone="onImage" />
          <SelectionMark checked={false} tone="onImage" />
        </View>
        <Switch value={enabled} onValueChange={setEnabled} />
        <Switch value={!enabled} onValueChange={(v) => setEnabled(!v)} size="sm" />
      </View>

      <UIKitSectionTitle>{t('uikit.components.segmented')}</UIKitSectionTitle>
      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { value: 'same', label: t('uikit.labels.same') },
          { value: 'days', label: t('uikit.labels.perDay') },
        ]}
      />
      <View style={styles.grid4}>
        {DURATIONS.map((label) => (
          <View key={label} style={styles.cell4}>
            <Chip label={label} selected={duration === label} onPress={() => setDuration(label)} />
          </View>
        ))}
      </View>
      <Chip label={t('uikit.labels.custom')} icon="clock" dashed />
      <View style={styles.grid7}>
        {WEEKDAYS.map((label, index) => (
          <View key={label} style={styles.cell7}>
            <Chip
              label={label}
              shape="field"
              mutedWhenIdle
              selected={days[index]}
              onPress={() => setDays((prev) => prev.map((v, i) => (i === index ? !v : v)))}
            />
          </View>
        ))}
      </View>

      <UIKitSectionTitle>{t('uikit.components.groups')}</UIKitSectionTitle>
      <GroupedCard>
        <ListItem
          inset={false}
          title={t('uikit.labels.timezone')}
          trailingText={t('uikit.labels.timezoneValue')}
          onPress={() => undefined}
        />
        <ListItem
          inset={false}
          title={t('uikit.labels.currency')}
          trailingText={t('uikit.labels.currencyValue')}
          onPress={() => undefined}
        />
        <ListItem
          inset={false}
          title={t('uikit.labels.hours')}
          subtitle={t('uikit.labels.hoursHint')}
          trailingText={t('uikit.labels.hoursValue')}
          onPress={() => undefined}
        />
      </GroupedCard>
      <GroupedCard>
        <ListItem
          inset={false}
          title={t('uikit.labels.onlineBooking')}
          subtitle={t('uikit.labels.onlineBookingHint')}
          right={<Switch value={enabled} onValueChange={setEnabled} />}
        />
        <ListItem
          inset={false}
          title={t('uikit.labels.selector')}
          right={<Switch value={manual} onValueChange={setManual} />}
        />
      </GroupedCard>
      <SectionLabel
        label={t('uikit.labels.section')}
        trailing={t('uikit.labels.sectionTrailing')}
      />
      <GroupedCard variant="outlined">
        <ListItem
          inset={false}
          size="sm"
          titleTone="secondary"
          title={t('uikit.labels.currency')}
          trailingText={t('uikit.labels.currencyValue')}
          showChevron={false}
        />
        <ListItem
          inset={false}
          size="sm"
          titleTone="secondary"
          title={t('uikit.labels.hours')}
          trailingText={t('uikit.labels.hoursValue')}
          showChevron={false}
        />
      </GroupedCard>
      <View style={styles.row}>
        <Avatar name="Karina Mikhailova" tone="brand" size="md" />
        <Avatar name="Karina Mikhailova" tone="brand" size="lg" />
        <Avatar name="Karina Mikhailova" tone="brand" size="xl" />
        <Avatar name="Aigerim" />
      </View>

      <UIKitSectionTitle>{t('uikit.components.cards')}</UIKitSectionTitle>
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
  stack: { gap: theme.space[2.5] },
  status: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1.5] },
  sheetCard: { paddingBottom: theme.space[4] },
  photo: {
    flexDirection: 'row',
    gap: theme.space[2],
    padding: theme.space[2.5],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.content.tertiary,
  },
  grid4: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] },
  cell4: { width: '22.5%', flexGrow: 1 },
  grid7: { flexDirection: 'row', gap: theme.space[1.5] },
  cell7: { flex: 1 },
  stateBox: {
    minHeight: 220,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.bg.surface,
  },
}));
