/** Top of the menu (design "Таб · Меню"): avatar, name, professions and city, edit button. */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { MasterProfile } from '@/entities/master';
import { Avatar, Icon, Skeleton, Text } from '@/shared/ui';
import { joinProfessions, profileLine } from '../lib/profile-line';

export function MenuProfileCard({ profile }: { profile: MasterProfile | null | undefined }) {
  const { t } = useTranslation();

  if (!profile) {
    return (
      <View style={styles.root}>
        <View style={styles.avatar}>
          <Skeleton width={84} height={84} radius={42} />
        </View>
        <View style={styles.name}>
          <Skeleton width={180} height={24} />
        </View>
      </View>
    );
  }

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
  const professions = joinProfessions(
    // A profile cached on disk by an older app version has no such field until it refetches.
    (profile.specializations ?? []).map((key) => t(`onboarding.specializations.${key}`)),
    t('menuHome.listAnd'),
  );

  return (
    <View style={styles.root}>
      <View style={styles.avatar}>
        <Avatar name={name} imageUrl={profile.avatar_url} color="rose" size="profile" />
      </View>
      <Text variant="stat" align="center" style={styles.name}>
        {name}
      </Text>
      <Text variant="footnote" color="secondary" align="center" style={styles.line}>
        {profileLine(professions, profile.city)}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/settings/profile')}
        style={({ pressed }) => [styles.edit, pressed && styles.pressed]}>
        <Icon name="pencil" size={15} weight="medium" />
        <Text variant="subheadStrong">{t('menuHome.editProfile')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { alignItems: 'center', paddingTop: theme.space[1] },
  avatar: {
    borderRadius: theme.sizing.avatar.profile / 2,
    boxShadow: `0px 0px 0px 4px ${theme.colors.bg.canvas}, 0px 0px 0px 5px ${theme.colors.brand.ring}, ${theme.shadow.avatarGlow}`,
  },
  name: { marginTop: theme.space[3.5] },
  line: { marginTop: 3 },
  edit: {
    marginTop: theme.space[3.5],
    height: theme.sizing.iconButton,
    paddingHorizontal: theme.space[4.5],
    borderRadius: theme.sizing.iconButton / 2,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.bg.canvas,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pressed: { opacity: 0.6 },
}));
