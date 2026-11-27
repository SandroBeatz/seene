/**
 * The photo on "Профиль" (design "Меню v2 · Профиль"): the avatar with a camera button
 * that picks a square photo and uploads it right away.
 */
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useUploadMasterImage, type MasterProfile } from '@/entities/master';
import { pickImage } from '@/shared/lib/image-picker';
import { Avatar, Icon, showFailedToast, showToast } from '@/shared/ui';

export function ProfileAvatar({
  profile,
  name,
  userId,
}: {
  profile: MasterProfile;
  name: string;
  userId: string;
}) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const upload = useUploadMasterImage(userId);
  const loading = upload.isPending && upload.variables.kind === 'avatar';

  const pick = async () => {
    const image = await pickImage({ square: true });
    if (!image) return;
    upload.mutate(
      { kind: 'avatar', ...image },
      {
        onSuccess: () => showToast({ title: t('toasts.profileSaved') }),
        onError: () => showFailedToast(),
      },
    );
  };

  return (
    <View style={styles.root}>
      <View>
        <Avatar name={name} imageUrl={profile.avatar_url} color="rose" size="profile" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('menuHome.profile.photoA11y')}
          disabled={loading}
          hitSlop={6}
          onPress={() => void pick()}
          style={({ pressed }) => [styles.edit, pressed && styles.pressed]}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.accent.onAccent} />
          ) : (
            <Icon name="camera" size={14} color="accent.onAccent" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { alignItems: 'center', paddingTop: theme.space[3], paddingBottom: theme.space[5] },
  edit: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: theme.colors.bg.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent.default,
  },
  pressed: { opacity: 0.7 },
}));
