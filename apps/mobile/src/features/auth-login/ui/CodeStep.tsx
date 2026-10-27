/**
 * Code step (design: "Код из письма"): six cells over one native field (iOS offers
 * the code from Mail above the keyboard), verified automatically on the last digit
 * or with "Продолжить". A wrong code turns the cells rose with a hint; a new code
 * can be requested after the cooldown.
 *
 * On success there is no navigation here: the new session flips the root guards
 * (→ onboarding for a new master, → the app for an existing one).
 */
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { useSendEmailCode, useVerifyEmailCode } from '@/entities/session';
import { type AppError, errorMessageKey } from '@/shared/api/errors';
import { Button, CodeInput, FormScreen, Text } from '@/shared/ui';
import { EMAIL_CODE_LENGTH } from '../model/schema';
import { formatCountdown, useCountdown } from '../model/useCountdown';
import { AuthHeading } from './AuthHeading';

export interface CodeStepProps {
  email: string;
  onBack: () => void;
}

export function CodeStep({ email, onBack }: CodeStepProps) {
  const { t } = useTranslation();
  const verify = useVerifyEmailCode();
  const resend = useSendEmailCode();
  const countdown = useCountdown();
  const [code, setCode] = useState('');
  const [invalid, setInvalid] = useState(false);

  function showError(e: AppError) {
    Alert.alert(t(errorMessageKey(e)));
  }

  function submit(value: string = code) {
    if (value.length !== EMAIL_CODE_LENGTH || verify.isPending) return;
    verify.mutate(
      { email, code: value },
      { onError: (e) => (e.kind === 'otp_invalid' ? setInvalid(true) : showError(e)) },
    );
  }

  function requestNewCode() {
    resend.mutate(email, {
      onSuccess: () => {
        setCode('');
        setInvalid(false);
        countdown.restart();
      },
      onError: showError,
    });
  }

  return (
    <FormScreen
      edges={['top', 'right', 'bottom', 'left']}
      footer={
        <Button
          label={t('auth.codeStep.submit')}
          disabled={code.length !== EMAIL_CODE_LENGTH}
          loading={verify.isPending}
          onPress={() => submit()}
        />
      }>
      <AuthHeading
        title={t('auth.codeStep.title')}
        subtitle={t('auth.codeStep.sentTo', { email })}
        onBack={onBack}
      />
      <View style={styles.code}>
        <CodeInput
          value={code}
          onChangeText={(next) => {
            setCode(next);
            if (invalid) setInvalid(false);
          }}
          onComplete={submit}
          length={EMAIL_CODE_LENGTH}
          error={invalid}
          accessibilityLabel={t('auth.codeStep.a11y')}
        />
      </View>
      {invalid ? (
        <Text
          variant="subhead"
          color="brandStrong"
          style={styles.invalid}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert">
          {t('auth.codeStep.invalid')}
        </Text>
      ) : null}
      <View style={styles.resend}>
        {countdown.left > 0 ? (
          <Text variant="subhead" color="secondary">
            {t('auth.codeStep.resendIn', { time: formatCountdown(countdown.left) })}
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={resend.isPending}
            hitSlop={12}
            onPress={requestNewCode}
            style={({ pressed }) => (pressed || resend.isPending) && styles.pressed}>
            <Text variant="subheadStrong">{t('auth.codeStep.resend')}</Text>
          </Pressable>
        )}
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  code: { marginTop: theme.space[7] },
  invalid: { marginTop: theme.space[3] },
  resend: { marginTop: theme.space[4.5], alignItems: 'flex-start' },
  pressed: { opacity: 0.6 },
}));
