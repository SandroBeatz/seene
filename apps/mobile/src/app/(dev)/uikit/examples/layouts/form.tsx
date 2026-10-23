import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { Button, FormScreen, Input } from '@/shared/ui';

export default function FormScreenExample() {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  return (
    <FormScreen
      contentContainerStyle={styles.content}
      footer={<Button label={t('common.save')} onPress={() => undefined} fullWidth />}>
      <Input label={t('onboarding.name')} value={value} onChangeText={setValue} />
      <Input label={t('navigation.appointmentNote')} multiline />
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({ content: { gap: theme.space[3] } }));
