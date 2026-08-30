/**
 * Email+password auth with a sign-in / create-account toggle, plus native Google
 * (behind the `googleSignIn` flag) and an Apple button gated off until an Apple
 * Developer account exists (docs/features.md §1). On success the session store's
 * `onAuthChange` subscription updates and protected routes switch onward — this form
 * only fires the mutation and surfaces errors.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { useSignIn, useSignInWithGoogle, useSignUp } from '@/entities/session';
import { type AppError, errorMessageKey } from '@/shared/api/errors';
import { featureFlags } from '@/shared/config/feature-flags';
import { Button, Input, Text } from '@/shared/ui';
import { SocialButton } from './SocialButton';
import { type AuthFormValues, type AuthMode, authSchema } from '../model/schema';

export interface AuthFormProps {
  /** Notified when the user toggles sign in ↔ create account (so the route can
   *  keep the native header title in sync). */
  onModeChange?: (mode: AuthMode) => void;
}

export function AuthForm({ onModeChange }: AuthFormProps = {}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isIOS = process.env.EXPO_OS === 'ios';

  const signIn = useSignIn();
  const signUp = useSignUp();
  const google = useSignInWithGoogle();

  const { control, handleSubmit, formState, setValue } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '', confirm: '', mode: 'signIn' },
  });

  const busy = signIn.isPending || signUp.isPending || google.isPending;

  function toErrorMessage(error: AppError): string {
    return t(errorMessageKey(error));
  }

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    setNotice(null);
    const creds = { email: values.email, password: values.password };
    if (mode === 'signIn') {
      signIn.mutate(creds, { onError: (e) => setFormError(toErrorMessage(e)) });
      return;
    }
    signUp.mutate(creds, {
      onError: (e) => setFormError(toErrorMessage(e)),
      onSuccess: ({ needsConfirmation }) => {
        // Auto-confirm projects sign the user straight in (onAuthChange routes them
        // onward). When confirmation is required there is no session yet, so tell the
        // user to check their inbox instead of leaving them on a silent form.
        if (needsConfirmation) setNotice(t('auth.confirmEmailSent', { email: values.email }));
      },
    });
  });

  function switchMode(next: AuthMode) {
    setFormError(null);
    setNotice(null);
    setMode(next);
    // Keep the schema's `mode` in sync so confirm-password validation applies.
    setValue('mode', next);
    onModeChange?.(next);
  }

  function onApple() {
    setFormError(null);
    if (!featureFlags.appleSignIn) setFormError(t('auth.appleComingSoon'));
    // Real native Apple Sign In lands once the Apple Developer account exists (Q-PROD-2).
  }

  return (
    <View style={styles.root}>
      <View style={styles.fields}>
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              label={t('auth.email')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!busy}
              error={fieldState.error ? t('auth.errors.email') : undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Input
              label={t('auth.password')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry
              autoCapitalize="none"
              textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
              editable={!busy}
              error={fieldState.error ? t('auth.errors.password') : undefined}
            />
          )}
        />
        {mode === 'signUp' ? (
          <Controller
            control={control}
            name="confirm"
            render={({ field, fieldState }) => (
              <Input
                label={t('auth.confirmPassword')}
                value={field.value ?? ''}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                secureTextEntry
                autoCapitalize="none"
                textContentType="newPassword"
                editable={!busy}
                error={fieldState.error ? t('auth.errors.confirm') : undefined}
              />
            )}
          />
        ) : null}
      </View>

      {formError ? (
        <Text variant="footnote" color="danger">
          {formError}
        </Text>
      ) : null}

      {notice ? (
        <Text variant="footnote" color="success">
          {notice}
        </Text>
      ) : null}

      <Button
        label={mode === 'signIn' ? t('auth.signIn') : t('auth.createAccount')}
        size="lg"
        onPress={() => void onSubmit()}
        loading={mode === 'signIn' ? signIn.isPending : signUp.isPending}
        disabled={busy || formState.isSubmitting}
        fullWidth
      />

      <Button
        label={mode === 'signIn' ? t('auth.switchToSignUp') : t('auth.switchToSignIn')}
        variant="ghost"
        onPress={() => switchMode(mode === 'signIn' ? 'signUp' : 'signIn')}
        disabled={busy}
        fullWidth
      />

      <View style={styles.separator}>
        <View style={styles.line} />
        <Text variant="footnote" color="tertiary">
          {t('auth.or')}
        </Text>
        <View style={styles.line} />
      </View>

      {/* iOS: Apple sits above Google (platform convention). */}
      {isIOS ? (
        <SocialButton
          provider="apple"
          label={t('auth.continueWithApple')}
          onPress={onApple}
          disabled={busy}
        />
      ) : null}

      {featureFlags.googleSignIn ? (
        <SocialButton
          provider="google"
          label={t('auth.continueWithGoogle')}
          onPress={() =>
            google.mutate(undefined, { onError: (e) => setFormError(toErrorMessage(e)) })
          }
          loading={google.isPending}
          disabled={busy}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { gap: theme.space[3], alignSelf: 'stretch' },
  fields: { gap: theme.space[3] },
  separator: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border.default },
}));
