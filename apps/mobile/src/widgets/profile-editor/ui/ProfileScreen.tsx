/**
 * "Профиль" (design AppMenuProfile). Names, link and bio are saved by "Готово"; the
 * rows open sheets with their own save, and photos upload as soon as they are picked.
 */
import { usePreventRemove } from 'expo-router/react-navigation';
import { router, Stack, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  addressLine,
  masterPageLabel,
  normalizeUsernameInput,
  useMasterProfileQuery,
  useRemoveMasterCover,
  useUpdateMasterProfile,
  useUploadMasterImage,
  useUsernameStatus,
  type MasterProfile,
} from '@/entities/master';
import { usePortfolioQuery } from '@/entities/portfolio';
import { useUserId } from '@/entities/session';
import { UsernameStatusLine } from '@/features/onboarding';
import { normalizeError } from '@/shared/api/errors';
import { pickImage } from '@/shared/lib/image-picker';
import { formatPhone } from '@/shared/lib/phone';
import {
  Avatar,
  Button,
  FormScreen,
  Input,
  MenuGroup,
  MenuRow,
  Skeleton,
  Text,
  showFailedToast,
  showErrorToast,
  showToast,
} from '@/shared/ui';

/** `master_profile_bio_length` in the database. */
const BIO_MAX_LENGTH = 600;

export function ProfileScreen() {
  const userId = useUserId() ?? '';
  const profile = useMasterProfileQuery(userId);
  if (!profile.data) {
    return (
      <FormScreen edges={['left', 'right']} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.photo}>
          <Skeleton width={84} height={84} radius={42} />
        </View>
        <Skeleton height={48} />
      </FormScreen>
    );
  }
  return <ProfileForm profile={profile.data} userId={userId} />;
}

function ProfileForm({ profile, userId }: { profile: MasterProfile; userId: string }) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName, setLastName] = useState(profile.last_name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [saved, setSaved] = useState(false);

  const update = useUpdateMasterProfile(userId);
  const upload = useUploadMasterImage(userId);
  const removeCover = useRemoveMasterCover(userId);
  const portfolio = usePortfolioQuery(userId);
  const checked = useUsernameStatus(username);

  const linkChanged = username !== profile.username;
  const dirty =
    firstName.trim() !== profile.first_name ||
    lastName.trim() !== profile.last_name ||
    linkChanged ||
    bio.trim() !== (profile.bio ?? '');
  const canSave =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    (!linkChanged || checked === 'free');

  const failed = () => showFailedToast();

  // Leave only after the render that lifted the guard below.
  useEffect(() => {
    if (saved) router.back();
  }, [saved]);

  usePreventRemove(dirty && !saved, ({ data }) => {
    Alert.alert(t('menuHome.profile.discardTitle'), undefined, [
      { text: t('menuHome.profile.keepEditing'), style: 'cancel' },
      {
        text: t('menuHome.profile.discard'),
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  const save = () =>
    update.mutate(
      {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username,
        bio: bio.trim() || null,
      },
      {
        onSuccess: () => {
          showToast({ title: t('toasts.profileSaved') });
          setSaved(true);
        },
        onError: (error) =>
          normalizeError(error).kind === 'username_taken'
            ? showErrorToast(t('onboarding.profile.usernameTaken'))
            : showFailedToast(save),
      },
    );

  const done = () => {
    if (!dirty) {
      router.back();
    } else if (linkChanged) {
      Alert.alert(
        t('menuHome.profile.linkChangeTitle'),
        t('menuHome.profile.linkChangeText', { link: masterPageLabel(profile.username) }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('menuHome.profile.linkChangeConfirm'), onPress: save },
        ],
      );
    } else {
      save();
    }
  };

  const pickAndUpload = async (kind: 'avatar' | 'cover') => {
    const image = await pickImage({ square: kind === 'avatar' });
    if (image) {
      upload.mutate(
        { kind, ...image },
        {
          onSuccess: () =>
            showToast({
              title: t(kind === 'cover' ? 'toasts.coverUpdated' : 'toasts.profileSaved'),
            }),
          onError: failed,
        },
      );
    }
  };

  const editCover = () => {
    if (!profile.cover_url) {
      void pickAndUpload('cover');
      return;
    }
    Alert.alert(t('menuHome.profile.cover'), undefined, [
      { text: t('menuHome.profile.coverChange'), onPress: () => void pickAndUpload('cover') },
      {
        text: t('menuHome.profile.coverRemove'),
        style: 'destructive',
        onPress: () => removeCover.mutate(undefined, { onError: failed }),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const uploading = upload.isPending ? upload.variables.kind : null;
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
  const specializations = (profile.specializations ?? [])
    .map((key) => t(`onboarding.specializations.${key}`))
    .join(', ');
  const add = t('menuHome.profile.add');
  const openContact = (field: 'whatsapp' | 'instagram' | 'telegram') =>
    router.push({ pathname: '/settings/contact', params: { field } });

  return (
    <>
      {process.env.EXPO_OS === 'ios' ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            variant="prominent"
            tintColor={theme.colors.content.primary}
            disabled={!canSave || update.isPending}
            onPress={done}>
            {t('common.done')}
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      ) : (
        <Stack.Screen
          options={{
            headerRight: () => (
              <Button
                label={t('common.done')}
                size="sm"
                disabled={!canSave}
                loading={update.isPending}
                onPress={done}
              />
            ),
          }}
        />
      )}
      <FormScreen
        edges={['left', 'right', 'bottom']}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}>
        <View style={styles.photo}>
          <Avatar name={name} imageUrl={profile.avatar_url} color="rose" size="profile" />
          <Pressable
            accessibilityRole="button"
            disabled={uploading === 'avatar'}
            onPress={() => void pickAndUpload('avatar')}
            style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}>
            <Text variant="subheadStrong" color="brandStrong">
              {uploading === 'avatar'
                ? t('menuHome.profile.uploading')
                : t('menuHome.profile.photo')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.fields}>
          <Input
            variant="filled"
            label={t('onboarding.profile.firstName')}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
          />
          <Input
            variant="filled"
            label={t('onboarding.profile.lastName')}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            autoComplete="family-name"
            textContentType="familyName"
          />
          <Input
            variant="filled"
            label={t('menuHome.profile.link')}
            prefix={t('onboarding.profile.usernamePrefix')}
            value={username}
            onChangeText={(text) => setUsername(normalizeUsernameInput(text))}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            maxLength={30}
            below={linkChanged ? <UsernameStatusLine status={checked} /> : undefined}
          />
          <Input
            variant="filled"
            label={t('menuHome.profile.about')}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={BIO_MAX_LENGTH}
          />
        </View>

        <MenuGroup label={t('menuHome.profile.specialization')}>
          <MenuRow
            title={specializations}
            onPress={() => router.push('/settings/specializations')}
          />
        </MenuGroup>

        <MenuGroup label={t('menuHome.profile.contacts')}>
          <MenuRow
            icon="whatsapp"
            title="WhatsApp"
            value={profile.whatsapp ? formatPhone(profile.whatsapp) : add}
            onPress={() => openContact('whatsapp')}
          />
          <MenuRow
            icon="instagram"
            title="Instagram"
            value={profile.instagram ? `@${profile.instagram}` : add}
            onPress={() => openContact('instagram')}
          />
          <MenuRow
            icon="telegram"
            title="Telegram"
            value={profile.telegram ? `@${profile.telegram}` : add}
            onPress={() => openContact('telegram')}
          />
          <MenuRow
            icon="mapPin"
            title={t('menuHome.profile.address')}
            value={addressLine(profile) || add}
            onPress={() => router.push('/settings/address')}
          />
        </MenuGroup>
        <Text variant="caption" color="tertiary" style={styles.hint}>
          {t('menuHome.profile.contactsHint')}
        </Text>

        <MenuGroup label={t('menuHome.profile.page')}>
          <MenuRow
            icon="image"
            title={t('menuHome.profile.cover')}
            value={
              uploading === 'cover'
                ? t('menuHome.profile.uploading')
                : profile.cover_url
                  ? t('menuHome.profile.coverChosen')
                  : t('menuHome.profile.coverNone')
            }
            onPress={editCover}
          />
          <MenuRow
            icon="gallery"
            title={t('menuHome.profile.portfolio')}
            value={t('menuHome.profile.portfolioCount', { count: portfolio.data?.length ?? 0 })}
            onPress={() => router.push('/settings/portfolio')}
          />
        </MenuGroup>
      </FormScreen>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingTop: theme.space[2], paddingBottom: theme.space[10] },
  photo: {
    alignItems: 'center',
    gap: theme.space[2],
    paddingTop: theme.space[1.5],
    paddingBottom: theme.space[1],
  },
  photoButton: {
    height: 32,
    paddingHorizontal: theme.space[3],
    justifyContent: 'center',
  },
  fields: { gap: theme.space[3] },
  hint: { marginTop: theme.space[2], marginHorizontal: theme.space[1] },
  pressed: { opacity: 0.6 },
}));
