import { useState } from 'react';
import { router } from 'expo-router';
import { ProfileCreatedModal, profileCreatedNotice } from '@/features/onboarding';
import { TodayScreen } from '@/widgets/today';

export default function HomeScreen() {
  // Once, right after onboarding.
  const [profileCreated, setProfileCreated] = useState(profileCreatedNotice.isPending);

  function closeProfileCreated() {
    profileCreatedNotice.clear();
    setProfileCreated(false);
  }

  return (
    <>
      <TodayScreen />
      <ProfileCreatedModal
        visible={profileCreated}
        onFillProfile={() => {
          closeProfileCreated();
          router.push('/settings/profile');
        }}
        onLater={closeProfileCreated}
      />
    </>
  );
}
