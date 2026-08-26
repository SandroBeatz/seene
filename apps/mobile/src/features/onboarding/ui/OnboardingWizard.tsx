/**
 * The mandatory 5-step onboarding wizard. Holds the draft locally, gates Next per
 * step, and writes everything at Step 5. `onComplete` is supplied by the route so
 * navigation stays in the app layer.
 */
import { useEffect, useState } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { isUsernameSyntaxValid, useUsernameAvailability } from '@/entities/master';
import { errorMessageKey } from '@/shared/api/errors';
import { Button, FormScreen, Text } from '@/shared/ui';
import { canAdvance, ONBOARDING_STEPS, STEP_COUNT, useOnboardingWizard } from '../model/wizard';
import { useCompleteOnboarding } from '../model/submit';
import {
  AddressStep,
  PersonalStep,
  ReviewStep,
  ScheduleStep,
  SpecializationsStep,
  type UsernameStatus,
} from './steps';

export function OnboardingWizard({ onComplete }: { onComplete?: () => void }) {
  const { t } = useTranslation();
  const { draft, step, update, setStep } = useOnboardingWizard();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const complete = useCompleteOnboarding();

  const availability = useUsernameAvailability(draft.username);
  const usernameStatus = deriveUsernameStatus(
    draft.username,
    availability.isFetching,
    availability.data,
  );

  const stepKey = ONBOARDING_STEPS[step];
  const isLast = step === STEP_COUNT - 1;
  const canNext = canAdvance(step, draft, availability.data);

  useEffect(() => {
    if (Platform.OS !== 'android' || step === 0) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep(step - 1);
      return true;
    });
    return () => subscription.remove();
  }, [setStep, step]);

  function goNext() {
    setSubmitError(null);
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    complete.mutate(draft, {
      onSuccess: onComplete,
      onError: (err) => setSubmitError(t(errorMessageKey(err))),
    });
  }

  return (
    <FormScreen
      edges={['top', 'left', 'right']}
      contentContainerStyle={styles.content}
      footer={
        <View style={styles.actions}>
          {step > 0 ? (
            <Button
              label={t('onboarding.back')}
              variant="ghost"
              onPress={() => setStep(step - 1)}
              disabled={complete.isPending}
            />
          ) : null}
          <View style={styles.spacer} />
          <Button
            label={isLast ? t('onboarding.finish') : t('onboarding.next')}
            onPress={goNext}
            disabled={!canNext || complete.isPending}
            loading={complete.isPending}
          />
        </View>
      }>
      <View style={styles.progress}>
        {ONBOARDING_STEPS.map((key, i) => (
          <View key={key} style={[styles.dot, i <= step ? styles.dotActive : styles.dotIdle]} />
        ))}
      </View>

      <Text variant="title2">{t(`onboarding.stepTitle.${stepKey}`)}</Text>
      <Text variant="footnote" color="tertiary">
        {t('onboarding.stepCounter', { current: step + 1, total: STEP_COUNT })}
      </Text>

      <View style={styles.body}>
        {stepKey === 'specializations' ? (
          <SpecializationsStep draft={draft} update={update} />
        ) : null}
        {stepKey === 'personal' ? (
          <PersonalStep draft={draft} update={update} usernameStatus={usernameStatus} />
        ) : null}
        {stepKey === 'address' ? <AddressStep draft={draft} update={update} /> : null}
        {stepKey === 'schedule' ? <ScheduleStep draft={draft} update={update} /> : null}
        {stepKey === 'review' ? <ReviewStep draft={draft} update={update} /> : null}
      </View>

      {submitError ? (
        <Text variant="footnote" color="danger">
          {submitError}
        </Text>
      ) : null}
    </FormScreen>
  );
}

function deriveUsernameStatus(
  username: string,
  isFetching: boolean,
  available: boolean | undefined,
): UsernameStatus {
  if (!username) return 'idle';
  if (!isUsernameSyntaxValid(username)) return 'invalid';
  if (isFetching) return 'checking';
  if (available === true) return 'available';
  if (available === false) return 'taken';
  return 'idle';
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[2], paddingBottom: theme.space[4] },
  progress: { flexDirection: 'row', gap: theme.space[2], marginBottom: theme.space[3] },
  dot: { flex: 1, height: 4, borderRadius: theme.radius.full },
  dotActive: { backgroundColor: theme.colors.accent.default },
  dotIdle: { backgroundColor: theme.colors.border.default },
  body: { marginTop: theme.space[3], paddingBottom: theme.space[6], gap: theme.space[3] },
  actions: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  spacer: { flex: 1 },
}));
