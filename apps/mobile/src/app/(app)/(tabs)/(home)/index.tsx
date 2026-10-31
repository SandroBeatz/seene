import { useState } from 'react';
import { router } from 'expo-router';
import { ProfileCreatedModal, profileCreatedNotice } from '@/features/onboarding';
import { CreatedToast } from '@/widgets/quick-create-flow';
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
      <CreatedToast />
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
