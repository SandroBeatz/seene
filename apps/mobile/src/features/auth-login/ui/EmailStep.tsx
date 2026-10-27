/**
 * Email step (design: "Ваша почта"): one field, then "Получить код" pinned above
 * the keyboard. Sends the one-time code and hands the normalized email to the
 * route, which opens the code step.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { useSendEmailCode } from '@/entities/session';
import { errorMessageKey } from '@/shared/api/errors';
import { Button, FormScreen, Input } from '@/shared/ui';
import { parseEmail } from '../model/schema';
import { AuthHeading } from './AuthHeading';

export interface EmailStepProps {
  onBack: () => void;
  onCodeSent: (email: string) => void;
}

export function EmailStep({ onBack, onCodeSent }: EmailStepProps) {
  const { t } = useTranslation();
  const send = useSendEmailCode();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const email = parseEmail(value);
    if (!email) {
      setError(t('auth.emailStep.invalid'));
      return;
    }
    send.mutate(email, {
      onSuccess: () => onCodeSent(email),
      onError: (e) => setError(t(errorMessageKey(e))),
    });
  }

  return (
    <FormScreen
      edges={['top', 'right', 'bottom', 'left']}
      footer={
        <Button
          label={t('auth.emailStep.submit')}
          disabled={!value.trim()}
          loading={send.isPending}
          onPress={submit}
        />
      }>
      <AuthHeading
        title={t('auth.emailStep.title')}
        subtitle={t('auth.emailStep.subtitle')}
        onBack={onBack}
      />
      <View style={styles.field}>
        <Input
          label={t('auth.emailStep.label')}
          size="lg"
          value={value}
          onChangeText={(text) => {
            setValue(text);
            if (error) setError(null);
          }}
          error={error ?? undefined}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          inputMode="email"
          returnKeyType="send"
          enterKeyHint="send"
          submitBehavior="submit"
          onSubmitEditing={submit}
        />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  field: { marginTop: theme.space[7] },
}));
