/**
 * Step 1 of 4 — "Ваш профиль": first/last name side by side and the booking link
 * `getseene.app/<username>` with a live availability check. Back here means leaving
 * onboarding, so it asks to sign out (native dialog). The name is prefilled from the
 * Google profile when there is one.
 */
import { useEffect, useRef } from 'react';
import { Alert, type TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { useAuthName, useSessionStore, useUserId } from '@/entities/session';
import { Button, FormScreen, Icon, Input, ScreenTitle, Text } from '@/shared/ui';
import { useOnboardingDraft } from '../model/draft.store';
import { normalizeUsernameInput } from '../model/username-input';
import { type UsernameStatus, useUsernameStatus } from '../model/username';
import { OnboardingHeader } from './OnboardingHeader';

export interface ProfileStepProps {
  onNext: () => void;
}

export function ProfileStep({ onNext }: ProfileStepProps) {
  const { t } = useTranslation();
  const userId = useUserId();
  const authName = useAuthName();
  const signOut = useSessionStore((state) => state.signOut);
  const draft = useOnboardingDraft();
  const status = useUsernameStatus(draft.username);
  const lastNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);

  const { begin } = draft;
  const { firstName: prefillFirst, lastName: prefillLast } = authName;
  useEffect(() => {
    if (userId) begin(userId, { firstName: prefillFirst, lastName: prefillLast });
  }, [begin, userId, prefillFirst, prefillLast]);

  const canContinue =
    draft.firstName.trim().length > 0 && draft.lastName.trim().length > 0 && status === 'free';

  function confirmSignOut() {
    Alert.alert(t('onboarding.signOut.title'), t('onboarding.signOut.message'), [
      { text: t('onboarding.signOut.cancel'), style: 'cancel' },
      {
        text: t('onboarding.signOut.confirm'),
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  }

  return (
    <FormScreen
      edges={['top', 'right', 'bottom', 'left']}
      header={<OnboardingHeader step={1} onBack={confirmSignOut} />}
      footer={
        <Button label={t('onboarding.next')} disabled={!canContinue} onPress={onNext} />
      }>
      <View style={styles.title}>
        <ScreenTitle
          title={t('onboarding.profile.title')}
          subtitle={t('onboarding.profile.subtitle')}
        />
      </View>

      <View style={styles.names}>
        <View style={styles.nameField}>
          <Input
            label={t('onboarding.profile.firstName')}
            value={draft.firstName}
            onChangeText={(firstName) => draft.setName({ firstName })}
            autoComplete="given-name"
            textContentType="givenName"
            autoCapitalize="words"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => lastNameRef.current?.focus()}
          />
        </View>
        <View style={styles.nameField}>
          <Input
            ref={lastNameRef}
            label={t('onboarding.profile.lastName')}
            value={draft.lastName}
            onChangeText={(lastName) => draft.setName({ lastName })}
            autoComplete="family-name"
            textContentType="familyName"
            autoCapitalize="words"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => usernameRef.current?.focus()}
          />
        </View>
      </View>

      <View style={styles.username}>
        <Input
          ref={usernameRef}
          label={t('onboarding.profile.username')}
          prefix={t('onboarding.profile.usernamePrefix')}
          strong
          value={draft.username}
          onChangeText={(text) => draft.setUsername(normalizeUsernameInput(text))}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          keyboardType="ascii-capable"
          maxLength={30}
          returnKeyType="done"
          onSubmitEditing={() => canContinue && onNext()}
          below={
            <View style={styles.below}>
              <UsernameStatusLine status={status} />
              <Text variant="footnote" color="secondary">
                {t('onboarding.profile.usernameHelp')}
              </Text>
            </View>
          }
        />
      </View>
    </FormScreen>
  );
}

function UsernameStatusLine({ status }: { status: UsernameStatus }) {
  const { t } = useTranslation();
  if (status === 'empty') return null;
  const free = status === 'free';
  const message = {
    invalid: t('onboarding.profile.usernameInvalid'),
    checking: t('onboarding.profile.usernameChecking'),
    free: t('onboarding.profile.usernameFree'),
    taken: t('onboarding.profile.usernameTaken'),
    error: t('onboarding.profile.usernameError'),
  }[status];
  const color = free ? 'success' : status === 'checking' ? 'secondary' : 'brandStrong';
  return (
    <View style={styles.status} accessibilityLiveRegion="polite">
      {free ? <Icon name="check" size={14} weight="heavy" color="feedback.success" /> : null}
      <Text variant="footnoteStrong" color={color}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: { marginTop: theme.space[7] },
  names: { marginTop: theme.space[6], flexDirection: 'row', gap: theme.space[2.5] },
  nameField: { flex: 1, minWidth: 0 },
  username: { marginTop: theme.space[4.5] },
  below: { gap: theme.space[2] },
  status: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1.5] },
}));
