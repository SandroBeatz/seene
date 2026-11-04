/** The address on the booking page. The country isn't edited here: it comes from sign-up. */
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  useMasterProfileQuery,
  useUpdateMasterProfile,
  type MasterProfile,
} from '@/entities/master';
import { useUserId } from '@/entities/session';
import { Button, FormScreen, Input, SheetChrome, showFailedToast, showToast } from '@/shared/ui';

export function ProfileAddressSheet() {
  const userId = useUserId() ?? '';
  const profile = useMasterProfileQuery(userId);
  if (!profile.data) return null;
  return <AddressForm profile={profile.data} userId={userId} />;
}

function AddressForm({ profile, userId }: { profile: MasterProfile; userId: string }) {
  const { t } = useTranslation();
  const update = useUpdateMasterProfile(userId);
  const [city, setCity] = useState(profile.city ?? '');
  const [address, setAddress] = useState(profile.address ?? '');
  const [house, setHouse] = useState(profile.house_number ?? '');

  const save = () =>
    update.mutate(
      {
        city: city.trim() || null,
        address: address.trim() || null,
        house_number: house.trim() || null,
      },
      {
        onSuccess: () => {
          showToast({ title: t('toasts.profileSaved') });
          router.back();
        },
        onError: () => showFailedToast(),
      },
    );

  return (
    <FormScreen
      edges={['left', 'right', 'bottom']}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      footer={
        <Button label={t('common.save')} loading={update.isPending} onPress={save} fullWidth />
      }>
      <SheetChrome title={t('menuHome.profile.address')} leadingLabel={t('common.close')} />
      <View style={styles.fields}>
        <Input
          variant="filled"
          label={t('menuHome.profile.city')}
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
          textContentType="addressCity"
        />
        <Input
          variant="filled"
          label={t('menuHome.profile.street')}
          value={address}
          onChangeText={setAddress}
          autoCapitalize="words"
          textContentType="streetAddressLine1"
        />
        <Input
          variant="filled"
          label={t('menuHome.profile.house')}
          value={house}
          onChangeText={setHouse}
        />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingTop: theme.space[2] },
  fields: { gap: theme.space[3] },
}));
