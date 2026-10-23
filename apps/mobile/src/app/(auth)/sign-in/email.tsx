import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { AuthForm, type AuthMode } from '@/features/auth-login';
import { FormScreen } from '@/shared/ui';

export default function EmailAuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useUnistyles();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const title = mode === 'signIn' ? t('auth.logIn') : t('auth.createAccount');
  const isIOS = process.env.EXPO_OS === 'ios';

  return (
    <>
      <Stack.Screen
        options={{
          title,
        }}
      />
      {isIOS ? (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            icon="xmark"
            accessibilityLabel={t('common.close')}
            tintColor={theme.colors.content.primary}
            variant="plain"
            onPress={() => router.dismiss()}
          />
        </Stack.Toolbar>
      ) : null}
      <FormScreen contentContainerStyle={styles.content}>
        <AuthForm onModeChange={setMode} />
      </FormScreen>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { gap: theme.space[4], paddingBottom: theme.space[8] },
}));
