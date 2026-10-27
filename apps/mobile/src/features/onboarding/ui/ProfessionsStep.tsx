/**
 * Step 2 of 4 — "Чем вы занимаетесь?": the 14 professions as photo tiles, two per
 * row, multi-select. The header stays put while the grid scrolls under a divided
 * footer whose button counts the picks.
 */
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import {
  SPECIALIZATION_IMAGES,
  SPECIALIZATION_KEYS,
  type SpecializationKey,
} from '@/shared/config/specializations';
import { Button, FormScreen, ScreenTitle } from '@/shared/ui';
import { useOnboardingDraft } from '../model/draft.store';
import { OnboardingHeader } from './OnboardingHeader';
import { ProfessionTile } from './ProfessionTile';

/** Two tiles per row, in the design's order. */
const ROWS: SpecializationKey[][] = Array.from(
  { length: Math.ceil(SPECIALIZATION_KEYS.length / 2) },
  (_, i) => SPECIALIZATION_KEYS.slice(i * 2, i * 2 + 2),
);

export interface ProfessionsStepProps {
  onBack: () => void;
  onNext: () => void;
  /** The final write is in flight (temporary: until steps 3–4 exist). */
  submitting?: boolean;
}

export function ProfessionsStep({ onBack, onNext, submitting = false }: ProfessionsStepProps) {
  const { t } = useTranslation();
  const selected = useOnboardingDraft((state) => state.specializations);
  const toggle = useOnboardingDraft((state) => state.toggleSpecialization);
  const count = selected.length;

  return (
    <FormScreen
      edges={['top', 'right', 'bottom', 'left']}
      header={
        <View style={styles.header}>
          <OnboardingHeader step={2} onBack={onBack} />
          <ScreenTitle
            title={t('onboarding.professions.title')}
            subtitle={t('onboarding.professions.subtitle')}
          />
        </View>
      }
      footerDivider
      footer={
        <Button
          label={
            count
              ? t('onboarding.professions.nextCount', { count })
              : t('onboarding.professions.nextEmpty')
          }
          disabled={count === 0}
          loading={submitting}
          onPress={onNext}
        />
      }>
      <View style={styles.grid}>
        {ROWS.map((row) => (
          <View key={row.join()} style={styles.row}>
            {row.map((key) => (
              <ProfessionTile
                key={key}
                label={t(`onboarding.specializations.${key}`)}
                image={SPECIALIZATION_IMAGES[key]}
                selected={selected.includes(key)}
                onPress={() => toggle(key)}
              />
            ))}
          </View>
        ))}
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: { gap: theme.space[7], paddingBottom: theme.space[5] },
  grid: { gap: theme.space[2.5] },
  row: { flexDirection: 'row', gap: theme.space[2.5] },
}));
