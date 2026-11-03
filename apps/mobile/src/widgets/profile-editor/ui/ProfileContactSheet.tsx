/** One contact of the profile: WhatsApp, Instagram or Telegram. Saving it empty removes it. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { normalizeInstagram, normalizeTelegram } from '@/entities/client';
import {
  parseStoredSchedule,
  useMasterProfileQuery,
  useUpdateMasterProfile,
  type MasterProfile,
} from '@/entities/master';
import { useUserId } from '@/entities/session';
import {
  defaultPhoneCountry,
  dialCode,
  formatPhone,
  phoneDigits,
  resolvePhoneInput,
} from '@/shared/lib/phone';
import { Button, FormScreen, Input, SheetChrome } from '@/shared/ui';

type ContactField = 'whatsapp' | 'instagram' | 'telegram';

const TITLES: Record<ContactField, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  telegram: 'Telegram',
};

export function ProfileContactSheet() {
  const { field } = useLocalSearchParams<{ field: ContactField }>();
  const userId = useUserId() ?? '';
  const profile = useMasterProfileQuery(userId);
  if (!profile.data) return null;
  return <ContactForm field={field} profile={profile.data} userId={userId} />;
}

function ContactForm({
  field,
  profile,
  userId,
}: {
  field: ContactField;
  profile: MasterProfile;
  userId: string;
}) {
  const { t } = useTranslation();
  const update = useUpdateMasterProfile(userId);
  const stored = profile[field];
  const isPhone = field === 'whatsapp';
  const dial = dialCode(
    defaultPhoneCountry(parseStoredSchedule(profile.schedule)?.timezone, profile.country),
  );
  const [value, setValue] = useState(
    isPhone ? (stored ? formatPhone(stored) : `${dial} `) : (stored ?? ''),
  );
  const [invalid, setInvalid] = useState(false);

  const save = () => {
    let next: string | null;
    if (isPhone) {
      // The dial code alone is the prefilled start, not a number.
      const empty = phoneDigits(value) === phoneDigits(dial) || !phoneDigits(value);
      next = empty ? null : resolvePhoneInput(value).canonical || null;
      if (!empty && !next) return setInvalid(true);
    } else {
      const normalize = field === 'telegram' ? normalizeTelegram : normalizeInstagram;
      next = value.trim() ? normalize(value) : null;
      if (value.trim() && !next) return setInvalid(true);
    }
    update.mutate(
      { [field]: next },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
      },
    );
  };

  return (
    <FormScreen
      edges={['left', 'right', 'bottom']}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      footer={
        <Button label={t('common.save')} loading={update.isPending} onPress={save} fullWidth />
      }>
      <SheetChrome title={TITLES[field]} leadingLabel={t('common.close')} />
      <Input
        variant="filled"
        accessibilityLabel={TITLES[field]}
        prefix={isPhone ? undefined : '@'}
        value={isPhone ? value : value.replace(/^@/, '')}
        onChangeText={(text) => {
          setInvalid(false);
          setValue(isPhone ? resolvePhoneInput(text).display : text);
        }}
        keyboardType={isPhone ? 'phone-pad' : 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        error={invalid ? t(`menuHome.profile.${field}Invalid`) : undefined}
        helpText={t('menuHome.profile.contactHelp')}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingTop: theme.space[2] },
}));
