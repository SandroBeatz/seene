/** The master's professions, at least one. Services keep theirs when one is taken off. */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useMasterProfileQuery, useUpdateMasterProfile } from '@/entities/master';
import { useUserId } from '@/entities/session';
import {
  SPECIALIZATION_IMAGES,
  SPECIALIZATION_KEYS,
  type SpecializationKey,
} from '@/shared/config/specializations';
import {
  Button,
  FormScreen,
  SelectionMark,
  SheetChrome,
  Text,
  showFailedToast,
  showToast,
} from '@/shared/ui';

export function ProfileSpecializationsSheet() {
  const userId = useUserId() ?? '';
  const profile = useMasterProfileQuery(userId);
  if (!profile.data) return null;
  return <SpecializationsForm initial={profile.data.specializations ?? []} userId={userId} />;
}

function SpecializationsForm({ initial, userId }: { initial: string[]; userId: string }) {
  const { t } = useTranslation();
  const update = useUpdateMasterProfile(userId);
  const [selected, setSelected] = useState(initial);

  const toggle = (key: SpecializationKey) =>
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );

  const save = () =>
    update.mutate(
      { specializations: selected },
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
      footerDivider
      footer={
        <Button
          label={t('common.save')}
          disabled={selected.length === 0}
          loading={update.isPending}
          onPress={save}
          fullWidth
        />
      }>
      <SheetChrome title={t('menuHome.profile.specialization')} leadingLabel={t('common.close')} />
      {SPECIALIZATION_KEYS.map((key) => {
        const on = selected.includes(key);
        const label = t(`onboarding.specializations.${key}`);
        return (
          <Pressable
            key={key}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={label}
            onPress={() => toggle(key)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <Image source={SPECIALIZATION_IMAGES[key]} style={styles.thumb} contentFit="cover" />
            <Text variant="calloutStrong" style={styles.label}>
              {label}
            </Text>
            <SelectionMark checked={on} shape="square" />
          </Pressable>
        );
      })}
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingTop: theme.space[2] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3.5],
    minHeight: theme.sizing.row.lg,
    paddingVertical: theme.space[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  thumb: {
    width: theme.sizing.avatar.md,
    height: theme.sizing.avatar.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg.sunken,
  },
  label: { flex: 1 },
  pressed: { opacity: 0.7 },
}));
