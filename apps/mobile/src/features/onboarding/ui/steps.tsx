/**
 * The five onboarding step bodies. Each is a controlled view over the wizard draft;
 * navigation, gating and the final write live in OnboardingWizard.
 */
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import {
  defaultTimeFormatForCountry,
  type OnboardingDraft,
  type WeeklySchedule,
} from '@/entities/master';
import { SPECIALIZATION_KEYS } from '@/shared/config/specializations';
import { Chip, Input, Switch, Text } from '@/shared/ui';

interface StepProps {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export function SpecializationsStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  function toggle(key: (typeof SPECIALIZATION_KEYS)[number]) {
    const has = draft.specializations.includes(key);
    update({
      specializations: has
        ? draft.specializations.filter((k) => k !== key)
        : [...draft.specializations, key],
    });
  }
  return (
    <View style={styles.section}>
      <Text variant="subhead" color="secondary">
        {t('onboarding.specializationsHint')}
      </Text>
      <View style={styles.chips}>
        {SPECIALIZATION_KEYS.map((key) => (
          <Chip
            key={key}
            label={t(`onboarding.specializations.${key}`)}
            selected={draft.specializations.includes(key)}
            onPress={() => toggle(key)}
          />
        ))}
      </View>
    </View>
  );
}

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function PersonalStep({
  draft,
  update,
  usernameStatus,
}: StepProps & { usernameStatus: UsernameStatus }) {
  const { t } = useTranslation();
  const usernameHelp = {
    idle: t('onboarding.usernameHint'),
    checking: t('onboarding.usernameChecking'),
    available: t('onboarding.usernameAvailable'),
    invalid: t('onboarding.usernameInvalid'),
    taken: undefined,
  }[usernameStatus];
  return (
    <View style={styles.section}>
      <Input
        label={t('onboarding.firstName')}
        value={draft.first_name}
        onChangeText={(first_name) => update({ first_name })}
        autoCapitalize="words"
        textContentType="givenName"
      />
      <Input
        label={t('onboarding.lastName')}
        value={draft.last_name}
        onChangeText={(last_name) => update({ last_name })}
        autoCapitalize="words"
        textContentType="familyName"
      />
      <Input
        label={t('onboarding.phone')}
        value={draft.phone}
        onChangeText={(phone) => update({ phone })}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
      />
      <Input
        label={t('onboarding.username')}
        value={draft.username}
        onChangeText={(username) => update({ username: username.toLowerCase() })}
        autoCapitalize="none"
        autoCorrect={false}
        helpText={usernameHelp}
        error={usernameStatus === 'taken' ? t('onboarding.usernameTaken') : undefined}
      />
    </View>
  );
}

export function AddressStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Input
        label={t('onboarding.country')}
        value={draft.country}
        onChangeText={(country) =>
          update({ country, time_format: defaultTimeFormatForCountry(country) })
        }
        autoCapitalize="characters"
        maxLength={2}
        helpText={t('onboarding.countryHint')}
      />
      <Input
        label={t('onboarding.street')}
        value={draft.address}
        onChangeText={(address) => update({ address })}
      />
      <Input
        label={t('onboarding.houseNumber')}
        value={draft.house_number}
        onChangeText={(house_number) => update({ house_number })}
      />
      <Input
        label={t('onboarding.city')}
        value={draft.city}
        onChangeText={(city) => update({ city })}
      />
      <Input
        label={t('onboarding.zip')}
        value={draft.zip_code}
        onChangeText={(zip_code) => update({ zip_code })}
      />
      <View style={styles.switchRow}>
        <Text variant="body">{t('onboarding.worksAtPlace')}</Text>
        <Switch
          value={draft.works_at_place}
          onValueChange={(works_at_place) => update({ works_at_place })}
        />
      </View>
      <View style={styles.switchRow}>
        <Text variant="body">{t('onboarding.canTravel')}</Text>
        <Switch value={draft.can_travel} onValueChange={(can_travel) => update({ can_travel })} />
      </View>
    </View>
  );
}

export function ScheduleStep({ draft, update }: StepProps) {
  const { t } = useTranslation();
  function patchDay(index: number, patch: Partial<WeeklySchedule[number]>) {
    const schedule = draft.schedule.map((day, i) =>
      i === index ? { ...day, ...patch } : day,
    ) as WeeklySchedule;
    update({ schedule });
  }
  return (
    <View style={styles.section}>
      {draft.schedule.map((day, index) => (
        <View key={DAY_KEYS[index]} style={styles.dayRow}>
          <View style={styles.dayHeader}>
            <Text variant="body">{t(`onboarding.days.${DAY_KEYS[index]}`)}</Text>
            <Switch value={day.enabled} onValueChange={(enabled) => patchDay(index, { enabled })} />
          </View>
          {day.enabled ? (
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <Input
                  label={t('onboarding.start')}
                  value={day.start}
                  onChangeText={(start) => patchDay(index, { start })}
                />
              </View>
              <View style={styles.timeInput}>
                <Input
                  label={t('onboarding.end')}
                  value={day.end}
                  onChangeText={(end) => patchDay(index, { end })}
                />
              </View>
            </View>
          ) : null}
        </View>
      ))}

      <Input
        label={t('onboarding.timezone')}
        value={draft.time_zone}
        onChangeText={(time_zone) => update({ time_zone })}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.switchRow}>
        <Text variant="body">{t('onboarding.timeFormat')}</Text>
        <View style={styles.chips}>
          <Chip
            label={t('onboarding.time12')}
            selected={draft.time_format === 12}
            onPress={() => update({ time_format: 12 })}
          />
          <Chip
            label={t('onboarding.time24')}
            selected={draft.time_format === 24}
            onPress={() => update({ time_format: 24 })}
          />
        </View>
      </View>
    </View>
  );
}

export function ReviewStep({ draft }: StepProps) {
  const { t } = useTranslation();
  const specs = draft.specializations.map((k) => t(`onboarding.specializations.${k}`)).join(', ');
  const rows: { label: string; value: string }[] = [
    { label: t('onboarding.name'), value: `${draft.first_name} ${draft.last_name}`.trim() },
    { label: t('onboarding.username'), value: `@${draft.username}` },
    { label: t('onboarding.phone'), value: draft.phone },
    { label: t('onboarding.specializationsLabel'), value: specs },
    { label: t('onboarding.country'), value: draft.country },
    { label: t('onboarding.timezone'), value: draft.time_zone },
  ];
  return (
    <View style={styles.section}>
      <Text variant="subhead" color="secondary">
        {t('onboarding.reviewHint')}
      </Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.reviewRow}>
          <Text variant="footnote" color="tertiary">
            {row.label}
          </Text>
          <Text variant="body">{row.value || '—'}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: theme.space[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayRow: { gap: theme.space[2] },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeRow: { flexDirection: 'row', gap: theme.space[3] },
  timeInput: { flex: 1 },
  reviewRow: { gap: theme.space[1] },
}));
